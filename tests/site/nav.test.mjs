// Pure navigation logic shared with TopBar.jsx.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NAV, UI, normalizePath, ariaCurrentFor, langOf } from '../../src/components/site/nav.js'

test('English nav: Projects · About · Contact (switch handled separately)', () => {
  assert.deepEqual(NAV.en.map(n => n.label), ['Projects', 'About', 'Contact'])
  assert.equal(UI.en.switchLabel, 'Español')
  assert.equal(UI.en.menu, 'Menu')
})

test('Spanish nav keeps the clinical entries and offers English', () => {
  assert.deepEqual(NAV.es.map(n => n.label), ['Inicio', 'Sobre mí', 'Informes', 'Lab', 'Contacto'])
  assert.equal(UI.es.switchLabel, 'English')
  for (const n of NAV.es) {
    assert.ok(n.href.startsWith('/es/') || n.href.startsWith('/lab/'), n.href)
  }
})

test('normalizePath strips trailing slash, hash and query', () => {
  assert.equal(normalizePath('/projects/'), '/projects')
  assert.equal(normalizePath('/'), '/')
  assert.equal(normalizePath(''), '/')
  assert.equal(normalizePath('/es/#contacto'), '/es')
  assert.equal(normalizePath('/about?x=1'), '/about')
})

test('aria-current: page for exact match, true inside a section', () => {
  const projects = NAV.en[0]
  assert.equal(ariaCurrentFor(projects, '/projects/'), 'page')
  assert.equal(ariaCurrentFor(projects, '/projects'), 'page')
  assert.equal(ariaCurrentFor(projects, '/projects/polar/'), 'true')
  assert.equal(ariaCurrentFor(projects, '/about/'), undefined)
  assert.equal(ariaCurrentFor(projects, '/projectsx/'), undefined)
  const lab = NAV.es.find(n => n.label === 'Lab')
  assert.equal(ariaCurrentFor(lab, '/lab/proyectos/polar/'), 'true')
  const contacto = NAV.es.find(n => n.label === 'Contacto')
  assert.equal(ariaCurrentFor(contacto, '/es/'), undefined)
})

test('langOf defaults to English', () => {
  assert.equal(langOf('es'), 'es')
  assert.equal(langOf('en'), 'en')
  assert.equal(langOf(undefined), 'en')
})
