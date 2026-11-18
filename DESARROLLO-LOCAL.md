# Desarrollo local de kineticaai.com

## Fuente y entorno

Repositorio: [kinetica-IA/portfolio-alfie](https://github.com/kinetica-IA/portfolio-alfie). Esta raíz contiene la web Astro/React y sus utilidades; los proyectos históricos de investigación no son la fuente de publicación del sitio.

Node compatible: >=22.12.0 y <23. La versión mayor 22 está en .nvmrc y en GitHub Actions. El entorno local se comprobó con Node 22.23.5 y npm 10.9.9; CI puede usar otro parche de Node 22.

package-lock.json fija las dependencias. Usar npm y conservarlo; no actualizar paquetes para reproducir una entrega.

## Instalación y comandos

Desde la raíz del checkout, con Node 22 activo:

    node --version
    npm ci
    npm run dev

Para generar y previsualizar la web:

    npm run build
    npm run preview

Si ya utilizas nvm, nvm use selecciona la versión indicada en .nvmrc. El archivo .nvmrc y engines no cambian por sí solos el Node de tu shell.

dist/, .astro/ y node_modules/ son derivados locales. El build debe corresponder a las fuentes que se pretende publicar. La última entrega comprobada genera dieciocho páginas.

## Estructura y comprobaciones

- Contenido: src/content/; esquema: src/content.config.ts.
- Cuatro casos: src/data/portfolio.json y src/pages/lab/proyectos/.
- Estilo: src/styles/, layouts y componentes existentes.
- Revisor editorial manual: scripts/editorial/; no está conectado al build ni a CI.
- Estudio retrospectivo Polar: scripts/polar/, artículo y resumen agregado; requisitos Python propios.

Pruebas del revisor, con Python 3:

    python3 -m unittest discover -s scripts/editorial -v

Revisión manual del corpus:

    python3 scripts/editorial/revisar_contenido.py --content-root src/content

Códigos: 0 significa ausencia de hallazgos en sus reglas limitadas; 1 requiere revisión humana; 2 indica error. Ninguno concede permiso clínico o de publicación.

## Publicación

.github/workflows/deploy.yml construye y publica en GitHub Pages al actualizar main. Revisar el diff y el alcance antes de publicar. No mezclar cambios locales ajenos a la entrega; verificar después el workflow y las rutas públicas.

La compilación no sustituye la revisión del contenido, una prueba de usabilidad o una validación clínica. No publicar diarios, parámetros personales, exports, recetas fotográficas originales o expedientes privados. Los datos privados de Polar permanecen fuera del repositorio y .venv/ queda ignorado.
