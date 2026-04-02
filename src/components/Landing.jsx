import { useTextDecode } from '../hooks/useTextDecode'
import CornerMarks from './CornerMarks'

const BRAND = 'KINETICA AI'

function Badge({ text }) {
  return (
    <span className="landing-badge">
      <span className="landing-badge-dot" />
      {text}
    </span>
  )
}

export default function Landing({ data }) {
  const brandDecoded = useTextDecode(BRAND, {
    duration: 1200, delay: 300, loop: false,
    isActive: true,
  })

  const targets = data?.predictor?.targets
  const nTargets = targets ? Object.keys(targets).length : 5
  const nDays = data?.series?.length || '200+'
  const bestAuc = targets?.severity?.best_auc?.toFixed(2) || '0.84'

  return (
    <section className="landing section" id="landing">
      <div className="landing-glass card-glass">
        <CornerMarks size={18} stroke={1.5} color="var(--accent)" opacity={0.35} />
        <h1 className="landing-title">{brandDecoded}</h1>

        <p className="landing-tagline">
          Clinical AI systems built where data meets the patient.
        </p>

        <p className="landing-description">
          We build predictive models that detect autonomic dysfunction patterns
          from consumer wearable data — turning nocturnal heart rate variability
          into early warning signals for post-infectious fatigue symptoms.
        </p>

        <div className="landing-badges">
          <Badge text={`${nTargets} symptom domains`} />
          <Badge text={`${nDays}+ days monitored`} />
          <Badge text={`AUC ${bestAuc} severity`} />
        </div>

        <div className="landing-cta">
          <a href="#research" className="landing-btn landing-btn-primary">Explore research ↓</a>
          <a href="#founder" className="landing-btn landing-btn-secondary">About the founder ↓</a>
        </div>
      </div>

      <style>{`
        .landing {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }
        .landing-glass {
          text-align: center;
          max-width: 620px;
          padding: 48px 40px;
        }
        .landing-title {
          font-family: var(--sans);
          font-weight: 400;
          font-size: clamp(2.5rem, 5vw, 3.5rem);
          letter-spacing: 0.2em;
          color: var(--text);
          margin-bottom: 16px;
          white-space: pre;
        }
        .landing-tagline {
          font-family: var(--sans);
          font-weight: 300;
          font-size: 1.1rem;
          color: var(--text-sec);
          max-width: 500px;
          margin: 0 auto 24px;
          line-height: 1.55;
        }
        .landing-description {
          font-family: var(--sans);
          font-weight: 300;
          font-size: 0.9rem;
          color: var(--text-dim);
          max-width: 480px;
          margin: 0 auto 20px;
          line-height: 1.65;
        }
        .landing-badges {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 32px;
        }
        .landing-badge {
          font-family: var(--mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-dim);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .landing-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--green);
          animation: dotPulse 2.5s ease-in-out infinite;
        }
        @keyframes dotPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(107,158,122,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(107,158,122,0); }
        }
        .landing-cta {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .landing-btn {
          font-family: var(--mono);
          font-size: 11px;
          padding: 10px 20px;
          border-radius: var(--radius-sm);
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .landing-btn-primary {
          border: 1.5px solid var(--green);
          color: var(--green);
        }
        .landing-btn-primary:hover {
          background: var(--green);
          color: white;
        }
        .landing-btn-secondary {
          border: 1px solid var(--border);
          color: var(--text-sec);
        }
        .landing-btn-secondary:hover {
          border-color: var(--accent);
          color: var(--text);
        }
      `}</style>
    </section>
  )
}
