import { useReveal } from '../hooks/useReveal'
import { useWordStagger } from '../hooks/useWordStagger'
import { OrbitSymbol } from './OrganicSymbols'

export default function Contact() {
  const { ref: headRef, words: headWords } = useWordStagger(
    "Let's build something that works in clinical reality."
  )
  const { ref: ctaRef, revealed: ctaRevealed } = useReveal(0.25)

  return (
    <section className="section contact" id="contact">
      <span className="eyebrow" style={{ color: 'var(--sea)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <OrbitSymbol color="var(--sand)" size={44} />
        COLLABORATE
      </span>
      <h2 className="contact-headline" ref={headRef}>
        {headWords.map((w, i) => <span key={i} style={w.style}>{w.text}</span>)}
      </h2>
      <p className="contact-services">
        Clinical AI consulting · Autonomic assessment · AI model evaluation
      </p>

      <div className="contact-status" ref={ctaRef} style={{
        opacity: ctaRevealed ? 1 : 0,
        transition: 'opacity 0.6s var(--ease-out) 0.3s',
      }}>
        <span className="status-led" />
        <span className="status-text">Available for projects</span>
      </div>

      <a
        href="mailto:alfon.atman@gmail.com"
        className="contact-cta"
        style={{
          opacity: ctaRevealed ? 1 : 0,
          transform: ctaRevealed ? 'scale(1)' : 'scale(0.95)',
          transition: 'opacity 0.6s var(--ease-out) 0.4s, transform 0.6s var(--ease-out) 0.4s',
        }}
      >
        Get in touch
      </a>

      <style>{`
        .contact {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
          padding-bottom: 32px;
        }
        .contact .eyebrow {
          display: block;
          margin-bottom: 16px;
        }
        .contact-headline {
          font-family: var(--sans);
          font-size: var(--text-section);
          font-weight: 400;
          color: var(--text-heading);
          line-height: 1.35;
          margin-bottom: 16px;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
        }
        .contact-services {
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--text-dim);
          margin-bottom: 28px;
        }
        .contact-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;
        }
        .status-led {
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
        .status-text {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
        }
        .contact:hover .status-led { opacity: 1; }
        .contact:hover .status-text { color: var(--text-sec); }
        .contact-cta {
          display: inline-block;
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--green);
          border: 1.5px solid var(--green);
          padding: 14px 36px;
          text-decoration: none;
          transition: all var(--duration-hover) var(--ease-out);
          margin-bottom: 28px;
        }
        .contact-cta:hover {
          background: var(--green);
          color: white;
          box-shadow: 0 2px 16px rgba(107,158,122,0.20);
        }
      `}</style>
    </section>
  )
}
