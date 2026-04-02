import CornerMarks from './CornerMarks'

export default function ProjectCards({ data }) {
  const targets = data?.predictor?.targets
  const severity = targets?.severity
  const nTargets = targets ? Object.keys(targets).length : '—'
  const nPairs = data?.predictor?.n_training || '—'
  const nDays = data?.series?.length || '—'

  return (
    <section className="section" id="projects">
      <div className="eyebrow" style={{ marginBottom: 24 }}>PROJECTS</div>

      <div className="project-grid">
        {/* Predictor Card */}
        <div className="project-card" style={{position:'relative'}}>
          <CornerMarks size={14} stroke={1.5} color="var(--accent)" opacity={0.25} />
          <div className="project-badge">PUBLISHED · PUBLIC REPO</div>
          <h3 className="project-title">ANS-Based Multi-Symptom Prediction</h3>
          <p className="project-sub">N=1 Longitudinal · Post-Lyme Fatigue · Consumer Wearable</p>

          <div className="project-metrics">
            <div className="project-metric">
              <span className="project-metric-value">{severity?.best_auc?.toFixed(2) || '—'}</span>
              <span className="project-metric-label">AUC</span>
            </div>
            <div className="project-metric">
              <span className="project-metric-value">{nTargets}</span>
              <span className="project-metric-label">Targets</span>
            </div>
            <div className="project-metric">
              <span className="project-metric-value">{nPairs}</span>
              <span className="project-metric-label">N pairs</span>
            </div>
            <div className="project-metric">
              <span className="project-metric-value">{nDays}</span>
              <span className="project-metric-label">Days</span>
            </div>
          </div>

          <div className="project-stack">Python · scikit-learn · neurokit2 · Polar Grit X2</div>
          <a href="https://github.com/kinetica-IA/polar-lyme-predictor" target="_blank" rel="noopener noreferrer" className="project-link">
            View on GitHub →
          </a>
        </div>

        {/* IO3 Card */}
        <div className="project-card" style={{position:'relative'}}>
          <CornerMarks size={14} stroke={1.5} color="var(--accent)" opacity={0.25} />
          <div className="project-badge" style={{ color: 'var(--warm)' }}>IN PROGRESS · ARCHITECTURE PUBLIC</div>
          <h3 className="project-title">IO3 · Clinical AI Agent</h3>
          <p className="project-sub">LangGraph ReAct Loop · Anthropic Claude · Human-on-Loop</p>
          <p className="project-desc">
            Local-first clinical reasoning agent. 9-node LangGraph graph
            with Haiku for exploration, Sonnet for synthesis. Human-on-loop
            as EU AI Act compliance differentiator.
          </p>
          <div className="project-stack">LangGraph · Anthropic Claude · ChromaDB · FastAPI · React</div>
          <a href="/io-architecture.html" className="project-link">
            View architecture →
          </a>
        </div>
      </div>

      <style>{`
        .project-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        @media (max-width: 768px) {
          .project-grid { grid-template-columns: 1fr; }
        }
        .project-card {
          background: rgba(14, 20, 20, 0.55);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid var(--border);
          border-radius: 0;
          padding: 24px;
          position: relative;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .project-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px var(--shadow);
        }
        .project-badge {
          font-family: var(--mono);
          font-size: 9px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--green);
          margin-bottom: 12px;
        }
        .project-title {
          font-family: var(--sans);
          font-weight: 500;
          font-size: 1.1rem;
          color: var(--text);
          margin-bottom: 6px;
        }
        .project-sub {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-dim);
          margin-bottom: 16px;
        }
        .project-desc {
          font-size: 13px;
          color: var(--text-sec);
          line-height: 1.6;
          margin-bottom: 16px;
        }
        .project-metrics {
          display: flex;
          gap: 20px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .project-metric {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .project-metric-value {
          font-family: var(--mono);
          font-size: 2rem;
          font-weight: 600;
          color: var(--text);
        }
        .project-metric-label {
          font-family: var(--mono);
          font-size: 9px;
          text-transform: uppercase;
          color: var(--text-dim);
          letter-spacing: 0.06em;
        }
        .project-stack {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-dim);
          margin-bottom: 12px;
        }
        .project-link {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--green);
        }
      `}</style>
    </section>
  )
}
