"""Revisión editorial local limitada. No red, modelos, escritura ni publicación.

No es una validación clínica/legal ni resuelve DOI. Un fallo nunca se aprueba.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re

VERSION = '1.0.0'
PHRASES = re.compile(
    r'\b(?:garantiz(?:ad[oa]s?|a(?:mos|n)?)|resultados?\s+seguros?|sin\s+riesgos?|'
    r'elimina\s+definitivamente|curaci[oó]n|en\s+\d+\s+sesiones)\b', re.I)
CONTEXT = re.compile(r'\b(?:no|nunca|evitar|evita|citar|ejemplo|negar|rechazar)\b|[«»“”"`]', re.I)

def review_text(text: str, collection: str, name: str) -> dict:
    if collection not in ('informes', 'lab'):
        raise ValueError('Colección fuera de alcance')
    lines = text.splitlines()
    if not lines or lines[0].strip() != '---':
        raise ValueError('No se pudo separar el frontmatter; no se evalúa')
    end = next((i for i in range(1, len(lines)) if lines[i].strip() == '---'), None)
    if end is None:
        raise ValueError('Frontmatter sin cierre; no se evalúa')
    header = '\n'.join(lines[1:end])
    if not any(x.strip() for x in lines[end+1:]):
        raise ValueError('Cuerpo vacío; no se evalúa')
    draft = re.search(r'^draft\s*:\s*(true|false)\s*$', header, re.M)
    row = {'file': name, 'collection': collection,
           'draft_literal': draft.group(1) == 'true' if draft else None,
           'findings': [], 'errors': []}
    if collection == 'informes':
        declared = re.findall(r'^\s*-\s*doi\s*:\s*(.+)$', header, re.M)
        if not any(x.strip().strip('"\'').strip() not in ('', 'null', '~') for x in declared):
            row['findings'].append({'rule': 'REFERENCIAS_PENDIENTES', 'line': 1,
                'message': 'No se detecta DOI declarado en el formato literal esperado; revisar fuentes. No se ha resuelto ningún DOI.'})
    fence = None
    for number, line in enumerate(lines[end+1:], start=end+2):
        marker = re.match(r'^\s*(`{3,}|~{3,})', line)
        if marker:
            chars = marker.group(1)
            if fence is None:
                fence = (chars[0], len(chars))
            elif chars[0] == fence[0] and len(chars) >= fence[1]:
                fence = None
            continue
        if fence or collection != 'informes':
            continue
        for match in PHRASES.finditer(line):
            row['findings'].append({'rule': 'EXPRESION_CON_CONTEXTO' if CONTEXT.search(line) else 'EXPRESION_A_REVISAR',
                'line': number, 'expression': match.group(0), 'excerpt': line[:180],
                'message': 'Revisión humana: puede ser cita, negación o explicación. No se bloquea ni reescribe automáticamente.'})
    if fence:
        row['errors'].append('Bloque de código sin cierre: no se acredita cobertura del resto del texto')
    return row

def scan(root: Path) -> dict:
    result = {'version': VERSION, 'scope': 'Solo Markdown de informes y lab; reglas clínicas solo en informes',
              'status': 'ERROR', 'files': [], 'errors': [], 'clinical_or_publication_approval': False,
              'not_checked': ['Veracidad clínica o legal', 'Resolución y correspondencia de DOI',
                 'Datos personales', 'Calidad semántica de respuestas', 'Frontmatter completo: lo valida Astro',
                 'Páginas fuera de informes/lab y contenido dentro de bloques de código']}
    if root.is_symlink() or not root.is_dir():
        result['errors'].append('Raíz ausente, no directorio o enlace simbólico')
        return result
    count = 0
    for collection in ('informes', 'lab'):
        directory = root / collection
        if directory.is_symlink() or not directory.is_dir():
            result['errors'].append(f'Colección ausente o enlace simbólico: {collection}')
            continue
        for file in sorted(directory.rglob('*')):
            if file.is_symlink():
                result['errors'].append(f'Enlace simbólico no examinado: {file.relative_to(root)}')
                continue
            if file.suffix != '.md' or not file.is_file():
                continue
            count += 1
            name = str(file.relative_to(root))
            try:
                if count > 1000 or file.stat().st_size > 2_000_000:
                    raise ValueError('Límite de tamaño o cantidad excedido')
                if not file.resolve().is_relative_to(directory.resolve()):
                    raise ValueError('Ruta fuera de la colección')
                content = file.read_bytes()
                row = review_text(content.decode('utf-8-sig'), collection, name)
                row['sha256'] = hashlib.sha256(content).hexdigest()
                result['files'].append(row)
            except (OSError, UnicodeError, ValueError) as error:
                result['errors'].append(f'{name}: {error}')
    if not result['files']:
        result['errors'].append('No hay archivos evaluados')
    if result['errors'] or any(row['errors'] for row in result['files']):
        result['status'] = 'ERROR'
    elif any(row['findings'] for row in result['files']):
        result['status'] = 'REQUIERE_REVISION_HUMANA'
    else:
        result['status'] = 'SIN_HALLAZGOS_EN_ESTAS_REGLAS'
    result['clinical_or_publication_approval'] = False
    return result

def exit_code(result: dict) -> int:
    return 2 if result['status'] == 'ERROR' else 1 if result['status'] == 'REQUIERE_REVISION_HUMANA' else 0

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--content-root', type=Path, required=True)
    args = parser.parse_args()
    try:
        report = scan(args.content_root)
    except (OSError, ValueError) as error:
        report = {'status': 'ERROR', 'errors': [str(error)], 'clinical_or_publication_approval': False}
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return exit_code(report)

if __name__ == '__main__':
    raise SystemExit(main())
