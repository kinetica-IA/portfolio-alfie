# Kinetica AI — Producción y Visibilidad

Soy Alfonso Navarro. Mi portfolio clínico está en www.kineticaai.com. Necesito que lo pongas en producción real: que Google lo indexe, que no haya archivos fantasma, y que la arquitectura sea la correcta.

Trabajo desde terminal en Mac. El repo está en `~/portfolio-alfie`. Cada `git push origin main` despliega automáticamente via GitHub Actions a GitHub Pages (~1 minuto).

---

## Estado actual del proyecto

**Stack:** Vite 6.3 + React 19 + vanilla CSS con design tokens. SPA estática — el HTML servido es un `<div id="root"></div>` vacío que React hidrata con JS. No hay SSR. No es Astro ni Next.js (el .gitignore tiene restos de Astro de una migración abandonada, sin código activo).

**Estructura del código:**
```
src/
├── App.jsx                          ← punto de entrada de la SPA
├── components/
│   ├── Hero.jsx                     ← Möbius band animation (canvas)
│   ├── ClinicalSignal.jsx           ← sección THE IDEA
│   ├── FlagshipProof.jsx            ← sección THE PROOF + LivePulse
│   ├── Founder.jsx                  ← sección THE BUILDER
│   ├── Systems.jsx                  ← sección HOW IT WORKS
│   ├── Published.jsx                ← sección PUBLISHED (cards)
│   ├── Contact.jsx                  ← sección COLLABORATE
│   ├── FooterField.jsx              ← footer + Orbital Ring (canvas)
│   ├── ClinicalField.jsx            ← Game of Life background (canvas)
│   └── OrganicSymbols.jsx           ← 6 micro-animaciones canvas por sección
├── hooks/
│   ├── usePolarData.js              ← fetch de datos biométricos vivos
│   ├── useReveal.js                 ← IntersectionObserver scroll reveal
│   ├── useCountUp.js, useWordStagger.js, useTextDecode.js
├── styles/
│   └── tokens.css                   ← design tokens (colores, tipografía, spacing)
index.html                           ← meta SEO, Open Graph, Schema.org JSON-LD
vite.config.js                       ← config de build
public/
├── CNAME                            ← dominio: www.kineticaai.com
├── robots.txt, sitemap.xml          ← SEO (desactualizados)
├── og-image.jpg                     ← 2.7MB (demasiado pesado)
├── googleaa24cf9918593077.html      ← verificación Google Search Console
├── data/polar_live.json             ← datos biométricos Polar (actualizado diariamente)
├── lyme-hrv.html                    ← LEGACY: página antigua HRV
├── diary.html                       ← LEGACY: diario síntomas
├── io-architecture.html             ← LEGACY: documentación IO3
├── manifest.webmanifest             ← PWA (idioma inconsistente)
└── icons/, assets/
.github/workflows/
├── deploy.yml                       ← build + deploy a GitHub Pages en push a main
├── polar-biometrics.yml             ← cron diario: descarga datos Polar
└── polar-retrain.yml                ← reentrenamiento ML
```

**Diseño visual:** El frontend tiene animaciones canvas complejas (Möbius band en hero, Game of Life como background, Orbital Ring en footer, 6 OrganicSymbols) + sistema de design tokens + scroll reveals + hover interactions. Todo esto DEBE preservarse en cualquier cambio.

---

## Problema: Google no ve mi web

Buscar `site:kineticaai.com` en Google devuelve SOLO dos PDFs obsoletos:
- `kineticaai.com/assets/Optimizacion-ARM64.pdf`
- `kineticaai.com/assets/IA-y-Empatia.pdf`

La página principal NO aparece. La razón: Google recibe un `<div id="root"></div>` vacío porque es SPA sin prerendering. Los PDFs sí se indexaron porque son texto plano.

---

## Lo que necesito — en orden de ejecución

### 1. Prerendering (resolver que Google vea contenido)

Implementar prerendering estático para que el HTML servido contenga el contenido real. Opciones:
- **vite-plugin-prerender** o **vite-plugin-ssr** como solución inmediata sin migrar
- **Migración a Astro** con islands React para las animaciones canvas (solución definitiva)

Evalúa ambas y recomienda. Si Astro es mejor, planifica la migración preservando todos los componentes canvas y el pipeline de datos vivos.

### 2. Limpiar archivos obsoletos

- Eliminar o redirigir `public/lyme-hrv.html`, `public/diary.html`, `public/io-architecture.html`
- Localizar y eliminar los PDFs fantasma en `/assets/` que Google tiene indexados (pueden venir de deploys antiguos de GitHub Pages)
- Bloquear `/assets/*.pdf` en `robots.txt` hasta que desaparezcan del índice
- Limpiar .gitignore de restos de Astro (`.astro/`, `*.backup.*.astro`)

### 3. SEO técnico completo

- **sitemap.xml**: actualizar fecha, incluir todas las rutas válidas
- **robots.txt**: bloquear rutas obsoletas, asegurar acceso a la SPA
- **og-image.jpg**: comprimir de 2.7MB a ~150KB (WebP o JPEG 1200x630)
- **Meta tags en index.html**: revisar title, description con keywords reales ("Post-Lyme HRV prediction", "N-of-1 clinical AI", "wearable autonomic monitoring")
- **JSON-LD Schema.org**: enriquecer — añadir tipo "Person" para Alfonso Navarro, "SoftwareApplication" para polar-lyme-predictor, "Dataset" para biometric archive
- **Canonical URL**: verificar que www y sin www resuelven igual, añadir `<link rel="canonical">`
- **manifest.webmanifest**: unificar idioma a inglés (ahora tiene mezcla español/inglés)

### 4. Backlinks y señales externas

- Verificar que Google Search Console está activo (existe el archivo de verificación)
- Enviar sitemap manualmente desde Search Console
- Solicitar indexación de la homepage
- Indicarme qué actualizar en LinkedIn y GitHub README para generar backlinks

### 5. Auditoría de rendimiento

- Lighthouse audit (performance, SEO, accessibility, best practices)
- Verificar que el build no incluye código muerto
- Evaluar si los canvas animations impactan el LCP (Largest Contentful Paint)

---

## Restricciones

- No romper las animaciones canvas (Möbius, Game of Life, Orbital Ring, OrganicSymbols)
- No cambiar el diseño visual — está pulido y aprobado
- Preservar el pipeline de datos vivos (polar_live.json)
- Deploy debe seguir siendo push-to-deploy automático
- Antes de hacer cada cambio, explícame qué vas a hacer y espera confirmación
