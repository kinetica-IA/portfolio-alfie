import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import revisar_contenido as audit

def document(body, refs=True):
    return '---\ntitle: Caso sintético\n'+('pubmed_refs:\n  - doi: "10.0000/synthetic"\n' if refs else '')+'---\n'+body+'\n'

class ReviewAcceptanceTests(unittest.TestCase):
    def test_literal_promise_produces_line_and_evidence(self):
        row=audit.review_text(document('Resultados seguros en 5 sesiones.'),'informes','informes/caso.md')
        findings=row['findings']; self.assertEqual(len(findings),2)
        self.assertEqual(findings[0]['line'],6); self.assertEqual(findings[0]['expression'],'Resultados seguros')

    def test_quotation_and_negation_require_context_not_approval(self):
        for body in ['Evitar «resultados seguros».','No garantizamos resultados seguros.']:
            row=audit.review_text(document(body),'informes','caso.md')
            self.assertTrue(row['findings'])
            self.assertTrue(all(x['rule']=='EXPRESION_CON_CONTEXTO' for x in row['findings']))

    def test_lab_does_not_inherit_patient_rules(self):
        row=audit.review_text(document('Ejemplo técnico: resultados seguros.',refs=False),'lab','lab/caso.md')
        self.assertEqual(row['findings'],[])

    def test_missing_references_remain_pending(self):
        row=audit.review_text(document('Texto de ejemplo.',refs=False),'informes','caso.md')
        self.assertEqual(row['findings'][0]['rule'],'REFERENCIAS_PENDIENTES')

    def test_code_example_is_excluded_without_hiding_prose(self):
        row=audit.review_text(document('```txt\nresultados seguros\n```\nResultados seguros.'),'informes','caso.md')
        self.assertEqual(len(row['findings']),1)
        self.assertEqual(row['findings'][0]['line'],9)

    def test_unclosed_code_cannot_yield_clear_status(self):
        row=audit.review_text(document('```txt\nresultados seguros'),'informes','caso.md')
        self.assertTrue(row['errors'])

    def test_absent_or_empty_root_is_error(self):
        with tempfile.TemporaryDirectory() as d:
            for root in [Path(d)/'missing',Path(d)]:
                report=audit.scan(root);self.assertEqual(report['status'],'ERROR');self.assertEqual(audit.exit_code(report),2)

    def test_read_failure_cannot_become_clear(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/'informes').mkdir();(root/'lab').mkdir();(root/'informes/a.md').write_text(document('Texto.'))
            with patch.object(Path,'read_bytes',side_effect=PermissionError('synthetic denial')):
                self.assertEqual(audit.scan(root)['status'],'ERROR')

    def test_symlink_to_external_text_is_not_read(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)/'content';root.mkdir();(root/'informes').mkdir();(root/'lab').mkdir()
            external=Path(d)/'outside.md';external.write_text('PRIVATE_SENTINEL')
            (root/'informes/link.md').symlink_to(external)
            report=audit.scan(root);self.assertEqual(report['status'],'ERROR')
            self.assertNotIn('PRIVATE_SENTINEL',json.dumps(report))

    def test_invalid_encoding_and_unclosed_header_are_errors(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/'informes').mkdir();(root/'lab').mkdir()
            (root/'informes/a.md').write_bytes(b'\xff')
            (root/'lab/b.md').write_text('---\ntitle: missing end')
            report=audit.scan(root);self.assertEqual(report['status'],'ERROR');self.assertGreaterEqual(len(report['errors']),2)

    def test_clear_means_only_limited_rules_checked(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/'informes').mkdir();(root/'lab').mkdir();(root/'informes/a.md').write_text(document('Texto sintético.'))
            report=audit.scan(root);self.assertEqual(report['status'],'SIN_HALLAZGOS_EN_ESTAS_REGLAS')
            self.assertFalse(report['clinical_or_publication_approval'])

    def test_cli_returns_nonzero_for_review_and_error(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/'informes').mkdir();(root/'lab').mkdir();(root/'informes/a.md').write_text(document('Resultados seguros.'))
            command=[sys.executable,str(Path(audit.__file__)),'--content-root']
            for folder,expected in [(root,1),(root/'missing',2)]:
                result=subprocess.run(command+[str(folder)],capture_output=True,text=True)
                self.assertEqual(result.returncode,expected);self.assertFalse(json.loads(result.stdout)['clinical_or_publication_approval'])

if __name__=='__main__':
    unittest.main()
