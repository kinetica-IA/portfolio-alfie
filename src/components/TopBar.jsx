import { useState, useEffect, useRef } from 'react'

const NAV = [
  { label: 'Inicio', href: '/' },
  { label: 'Sobre mí', href: '/about' },
  { label: 'Informes', href: '/informes' },
  { label: 'Lab', href: '/lab' },
  { label: 'Contacto', href: '/#contacto' },
]

export default function TopBar() {
  const [visible, setVisible] = useState(true)
  const lastY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y < 100) { setVisible(true) }
      else { setVisible(y < lastY.current) }
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="topbar"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
      }}
    >
      <a href="/" className="topbar-brand">
        KINETICAAI
      </a>

      <nav className="topbar-nav">
        {NAV.map(n => (
          <a key={n.href} href={n.href} className="topbar-link">
            {n.label}
          </a>
        ))}
      </nav>

      <div className="topbar-icons">
        <a href="https://www.linkedin.com/in/navarro-kinetica-ai" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="topbar-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>
        <a href="mailto:alfon.atman@gmail.com" aria-label="Email" className="topbar-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 48px;
          background: rgba(240, 249, 249, 0.92);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-bottom: 1px solid var(--border);
          transition: transform 0.3s var(--ease-out);
        }
        .topbar-brand {
          font-family: var(--sans);
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          color: var(--text-heading);
          text-decoration: none;
        }
        .topbar-nav {
          display: flex;
          gap: 28px;
        }
        .topbar-link {
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--text-dim);
          text-decoration: none;
          transition: color var(--duration-hover) ease;
        }
        .topbar-link:hover { color: var(--text); }
        .topbar-icons {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .topbar-icon {
          color: var(--text-dim);
          transition: color var(--duration-hover) ease;
          display: flex;
        }
        .topbar-icon:hover { color: var(--sea); }
        @media (max-width: 768px) {
          .topbar { padding: 0 20px; }
        }
        @media (max-width: 640px) {
          .topbar-nav { display: none; }
          .topbar { padding: 0 16px; }
        }
      `}</style>
    </header>
  )
}
