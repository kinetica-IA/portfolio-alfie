// Navigation data and pure helpers shared by TopBar.jsx and the tests in
// tests/site/. No DOM access here.

export const NAV = {
  en: [
    { label: 'Projects', href: '/projects/', section: '/projects' },
    { label: 'About', href: '/about/' },
    { label: 'Contact', href: '/contact/' },
  ],
  es: [
    { label: 'Inicio', href: '/es/' },
    { label: 'Sobre mí', href: '/es/about/' },
    { label: 'Informes', href: '/es/informes/', section: '/es/informes' },
    { label: 'Lab', href: '/lab/', section: '/lab' },
    { label: 'Contacto', href: '/es/#contacto', hash: true },
  ],
}

export const UI = {
  en: {
    home: '/',
    menu: 'Menu',
    navLabel: 'Main',
    switchLabel: 'Español',
    switchLang: 'es',
    switchFallback: '/es/',
    email: 'Email',
    linkedin: 'LinkedIn (opens in a new tab)',
  },
  es: {
    home: '/es/',
    menu: 'Menú',
    navLabel: 'Principal',
    switchLabel: 'English',
    switchLang: 'en',
    switchFallback: '/',
    email: 'Correo electrónico',
    linkedin: 'LinkedIn (se abre en una pestaña nueva)',
  },
}

export function normalizePath(path) {
  if (!path) return '/'
  let p = String(path).split('#')[0].split('?')[0]
  if (!p.startsWith('/')) p = '/' + p
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
  return p || '/'
}

// 'page' for the exact page, 'true' for a page inside the item's section,
// undefined otherwise. Hash links (in-page anchors) are never current.
export function ariaCurrentFor(item, path) {
  if (item.hash) return undefined
  const p = normalizePath(path)
  if (normalizePath(item.href) === p) return 'page'
  if (item.section && p.startsWith(item.section + '/')) return 'true'
  return undefined
}

export function langOf(value) {
  return value === 'es' ? 'es' : 'en'
}
