import { useReveal } from '../hooks/useReveal'
import { CellSymbol } from './OrganicSymbols'

const MAILTO_HREF = 'mailto:alfon.atman@gmail.com?subject=Consulta%20osteopat%C3%ADa&body=Describe%20tu%20problema%20con%20tus%20palabras.'

export default function FounderContact() {
  const { ref: ctaRef, revealed: ctaRevealed } = useReveal(0.25)

  return (
    <section className="section founder-contact" id="contacto" ref={ctaRef}>
      <span className="eyebrow" style={{ color: 'var(--teal)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <CellSymbol color="var(--clay)" size={44} />
        CONTACTO
      </span>

      <div
        className="fc-cta-area"
        style={{
          opacity: ctaRevealed ? 1 : 0,
          transform: ctaRevealed ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.9s var(--ease-out) 0.2s, transform 0.6s var(--ease-out) 0.2s',
        }}
      >
        <div className="fc-status">
          <span className="fc-status-led" />
          <span className="fc-status-text">Consulta abierta</span>
        </div>
        <div className="fc-btns">
          <a href={MAILTO_HREF} className="fc-btn fc-btn--primary">
            Cuéntame tu caso, sin compromiso
          </a>
          <a
            href="https://www.linkedin.com/in/navarro-kinetica-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="fc-btn fc-btn--secondary"
          >
            Conectar en LinkedIn
          </a>
        </div>
      </div>

      <style>{`
        .founder-contact {
          display: flex;
          flex-direction: column;
          gap: 32px;
          padding-bottom: 40px;
        }
        /* CTA area */
        .fc-cta-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          text-align: center;
        }
        .fc-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .fc-status-led {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--green);
          animation: ledPulse 2s ease-in-out infinite;
        }
        @keyframes ledPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .fc-status-text {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
        }
        .fc-btns {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .fc-btn {
          font-family: var(--mono);
          font-size: var(--text-caption);
          padding: 13px 28px;
          text-decoration: none;
          transition: all var(--duration-hover) var(--ease-out);
        }
        .fc-btn--primary {
          border: 1.5px solid var(--green);
          color: var(--green);
        }
        .fc-btn--primary:hover {
          background: var(--green);
          color: white;
          box-shadow: 0 2px 12px rgba(107,158,122,0.15);
        }
        .fc-btn--secondary {
          border: 1px solid var(--border-active);
          color: var(--text-dim);
        }
        .fc-btn--secondary:hover {
          border-color: var(--teal);
          color: var(--text);
        }
        @media (max-width: 480px) {
          .fc-btns { flex-direction: column; align-items: stretch; }
          .fc-btn { text-align: center; }
        }
      `}</style>
    </section>
  )
}
