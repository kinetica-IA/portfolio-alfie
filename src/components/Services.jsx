const SERVICES = [
  {
    title: 'Clinical AI Consulting',
    icon: '/icons/consult.svg',
    desc: 'Wearable data pipelines, autonomic monitoring, clinical decision support. Remote worldwide.',
  },
  {
    title: 'Autonomic Assessment',
    icon: '/icons/biomech.svg',
    desc: 'HRV-guided load management, post-infectious fatigue protocols. Evidence-based.',
  },
  {
    title: 'AI Model Evaluation',
    icon: '/icons/neuro.svg',
    desc: 'LLM evaluation for clinical safety and reasoning quality. Active evaluator for Anthropic.',
  },
]

import CornerMarks from './CornerMarks'

export default function Services() {
  return (
    <section className="section" id="services">
      <div className="eyebrow" style={{ marginBottom: 24 }}>SERVICES</div>

      <div className="services-grid">
        {SERVICES.map(s => (
          <div key={s.title} className="service-card">
            <CornerMarks size={12} stroke={1} color="var(--accent)" opacity={0.25} />
            <img src={s.icon} alt="" className="service-icon" />
            <h3 className="service-title">{s.title}</h3>
            <p className="service-desc">{s.desc}</p>
          </div>
        ))}
      </div>

      <style>{`
        .services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 768px) {
          .services-grid { grid-template-columns: 1fr; }
        }
        .service-card {
          background: rgba(14, 20, 20, 0.55);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid var(--border);
          border-radius: 0;
          padding: 24px;
          position: relative;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .service-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px var(--shadow);
        }
        .service-icon {
          width: 48px;
          height: 48px;
          margin-bottom: 12px;
          opacity: 0.7;
        }
        .service-title {
          font-family: var(--sans);
          font-weight: 500;
          font-size: 1rem;
          color: var(--text);
          margin-bottom: 8px;
        }
        .service-desc {
          font-size: 13px;
          color: var(--text-sec);
          line-height: 1.55;
        }
      `}</style>
    </section>
  )
}
