# Revisión editorial local, versión 1.0

Utilidad manual derivada de la revisión de IO3/ALMA. No importa su código ni carga modelos, perfiles, corpus, memorias o servicios. Usa únicamente la biblioteca estándar de Python; comprobada con Python 3.13.11. La fuente operativa queda en `scripts/editorial/` de la web principal. La copia del expediente es una evidencia congelada de esta versión.

```sh
python3 scripts/editorial/revisar_contenido.py --content-root src/content
python3 -m unittest discover -s scripts/editorial -v
```

Ejecutar desde la raíz del proyecto. El programa escribe JSON en stdout; no modifica archivos. No está conectado a `npm run build`, CI, hooks o publicación.

Alcance: archivos Markdown de `informes` y `lab`. En informes señala unas pocas expresiones editoriales y la ausencia de declaraciones DOI en el formato literal examinado. Las citas, negaciones y ejemplos requieren interpretación humana. Las reglas para pacientes no se aplican a Lab. El frontmatter completo lo valida Astro; este programa solo necesita separar cabecera y cuerpo. Sus expresiones regulares no son un parser YAML general.

Estados y códigos de salida:

| Estado | Código | Interpretación |
|---|---:|---|
| `SIN_HALLAZGOS_EN_ESTAS_REGLAS` | 0 | No aparecieron avisos en este conjunto limitado de reglas. No acredita calidad o permiso de publicación. |
| `REQUIERE_REVISION_HUMANA` | 1 | Hay avisos localizados que deben interpretarse. No son una declaración automática de infracción. |
| `ERROR` | 2 | Hay archivos no examinados, entradas incompletas o fallos; nunca aprobación por defecto. |

Siempre devuelve `clinical_or_publication_approval: false`. No verifica veracidad, datos personales, DOI por red, correspondencia de citas o páginas fuera de su alcance. Los bloques de código se excluyen; un bloque sin cierre deja error. Raíces ausentes, colecciones ausentes, textos vacíos, archivos ilegibles, codificación inválida y enlaces simbólicos tampoco se convierten en éxito.

Pruebas: doce casos de aceptación, incluidos fallos de lectura, enlaces fuera del alcance, cabeceras incompletas, rutas inexistentes, citas/negaciones y códigos del CLI. El primer ensayo detectó un campo ausente en una salida temprana de error; se corrigió antes de integrar. Las doce pruebas finales pasan. El escaneo de nueve Markdown actuales no produjo avisos en estas reglas; esa observación no es una validación clínica/editorial completa.

Procedencia conceptual: las reglas editoriales vigentes de la web y la lección del `l2_factual.py` legado de ALMA, que devolvía PASS ante ciertos fallos. Aquí se conserva la distinción entre error, revisión pendiente y ausencia limitada de hallazgos. No se reutilizan sus umbrales ni se afirma que ALMA esté validado. No se ha modificado el original archivado.

## Cierre funcional — 18/11/2026

Se mantienen doce pruebas de aceptación superadas y el uso real sobre nueve
Markdown, sin avisos en estas reglas. Esta v1 queda como herramienta manual
consultable; no se reactivan la plataforma, supervisores o rutinas de IO3/ALMA.
La utilidad y los falsos negativos no están calibrados con un corpus humano de
referencia. No se necesita ampliar reglas para conservar este resultado.
