import { useState, useEffect, useRef } from 'react'
import { NAV, UI, ariaCurrentFor, langOf } from './site/nav.js'

// Fixed top bar. Persisted across ClientRouter navigations
// (transition:persist in Layout.astro); Astro copies the new page's props
// into the persisted island, so `lang`, `path` and `switchHref` stay current.
//
// Below 720px (so always below 640px) the nav collapses into a panel opened by the "Menu" button
// (aria-expanded / aria-controls). Escape closes it and returns focus to the
// button; it also closes after every page swap and on clicks outside.
// Without JS, a <noscript> style in Layout.astro shows the links instead.
export default function TopBar({ lang = 'en', path = '/', switchHref }) {
  const l = langOf(lang)
  const ui = UI[l]
  const items = NAV[l]
  const altHref = switchHref || ui.switchFallback

  const [visible, setVisible] = useState(true)
  const [open, setOpen] = useState(false)
  const lastY = useRef(0)
  const openRef = useRef(false)
  const headerRef = useRef(null)
  const buttonRef = useRef(null)

  openRef.current = open

  // Hide on scroll down, show on scroll up; never hide while the menu is open.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (openRef.current || y < 100) setVisible(true)
      else setVisible(y < lastY.current)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close after ClientRouter swaps the page, and whenever the page changes.
  useEffect(() => {
    const close = () => setOpen(false)
    document.addEventListener('astro:after-swap', close)
    return () => document.removeEventListener('astro:after-swap', close)
  }, [])
  useEffect(() => { setOpen(false) }, [path, l])

  // Escape closes and returns focus; a click outside the header closes.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    const onPointer = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  // Leaving the mobile breakpoint closes the panel.
  // 720px rather than 640px: the Spanish nav (six links) does not fit
  // between 641px and ~700px.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 721px)')
    const onChange = (e) => { if (e.matches) setOpen(false) }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <header
      ref={headerRef}
      className="topbar"
      onFocus={() => setVisible(true)}
      style={{ transform: visible || open ? 'translateY(0)' : 'translateY(-100%)' }}
    >
      <a href={ui.home} className="topbar-brand">
        KINETICAAI
      </a>

      <button
        ref={buttonRef}
        type="button"
        className="topbar-menu-btn"
        aria-expanded={open ? 'true' : 'false'}
        aria-controls="site-nav"
        onClick={() => setOpen(o => !o)}
      >
        {ui.menu}
      </button>

      <nav id="site-nav" aria-label={ui.navLabel} className={open ? 'topbar-nav is-open' : 'topbar-nav'}>
        <ul className="topbar-list">
          {items.map(n => (
            <li key={n.href}>
              <a href={n.href} className="topbar-link" aria-current={ariaCurrentFor(n, path)}>
                {n.label}
              </a>
            </li>
          ))}
          <li className="topbar-switch-item">
            <a href={altHref} className="topbar-link topbar-switch" lang={ui.switchLang} hrefLang={ui.switchLang}>
              {ui.switchLabel}
            </a>
          </li>
        </ul>
      </nav>

      <div className="topbar-icons">
        <a href="https://www.linkedin.com/in/navarro-kinetica-ai" target="_blank" rel="noopener noreferrer" aria-label={ui.linkedin} className="topbar-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>
        <a href="mailto:alfon.atman@gmail.com" aria-label={ui.email} className="topbar-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M22 4L12 13 2 4"/>
          </svg>
        </a>
      </div>

      <style>{`
        .topbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 9999;
          height: var(--header-h, 56px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 0 48px;
          background: rgba(240, 249, 249, 0.92);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-bottom: 1px solid var(--border);
          transition: transform 0.3s var(--ease-out);
        }
        .topbar-brand {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          font-family: var(--sans);
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          color: var(--text-heading);
          text-decoration: none;
        }
        .topbar-menu-btn { display: none; }
        .topbar-nav { display: flex; }
        .topbar-list {
          display: flex;
          align-items: center;
          gap: 28px;
          list-style: none;
        }
        .topbar-link {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--text-dim);
          text-decoration: none;
          transition: color var(--duration-hover) ease;
        }
        .topbar-link:hover { color: var(--text-heading); }
        .topbar-link[aria-current] {
          color: var(--text-heading);
          text-decoration: underline;
          text-underline-offset: 6px;
          text-decoration-thickness: 1px;
        }
        .topbar-switch-item {
          padding-left: 20px;
          border-left: 1px solid var(--border-active);
        }
        .topbar-icons {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .topbar-icon {
          color: var(--text-dim);
          transition: color var(--duration-hover) ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          min-height: 32px;
        }
        .topbar-icon:hover { color: var(--sea-text); }
        @media (max-width: 900px) {
          .topbar { padding: 0 20px; }
          .topbar-list { gap: 20px; }
        }
        @media (max-width: 720px) {
          .topbar { padding: 0 12px 0 16px; gap: 8px; }
          .topbar-brand { margin-right: auto; }
          .topbar-menu-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 44px;
            min-width: 44px;
            padding: 0 14px;
            font-family: var(--mono);
            font-size: var(--text-caption);
            color: var(--text-heading);
            background: transparent;
            border: 1px solid var(--border-active);
            border-radius: 2px;
            cursor: pointer;
          }
          .topbar-menu-btn[aria-expanded="true"] {
            background: var(--fill-teal);
            border-color: var(--focus-ring);
          }
          .topbar-nav {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--bg);
            border-bottom: 1px solid var(--border-active);
            box-shadow: 0 8px 24px var(--shadow);
            padding: 8px 0;
          }
          .topbar-nav.is-open { display: block; }
          .topbar-list {
            flex-direction: column;
            align-items: stretch;
            gap: 0;
          }
          .topbar-link {
            display: flex;
            min-height: 48px;
            padding: 0 20px;
            font-size: 0.9375rem;
          }
          .topbar-switch-item {
            padding-left: 0;
            border-left: none;
            border-top: 1px solid var(--border);
            margin-top: 4px;
          }
          .topbar-icons { gap: 0; }
          .topbar-icon { min-width: 44px; min-height: 44px; }
        }
      `}</style>
    </header>
  )
}
