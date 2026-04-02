export default function Systems({ data }) {
  const nPairs = data?.predictor?.n_training || 60
  const nDays = data?.series?.length || 198

  return (
    <section className="section" id="systems">
      <span className="eyebrow">SYSTEMS</span>
      <h2 className="sys-title">From heartbeat to prediction</h2>

      {/* Item 01 */}
      <div className="sys-item">
        <span className="sys-num">01</span>
        <div className="sys-content">
          <span className="sys-badge sys-badge--green">PUBLISHED · PUBLIC REPO</span>
          <h3 className="sys-item-title">ANS-Based Multi-Symptom Prediction</h3>
          <p className="sys-item-sub">N=1 Longitudinal · Post-Lyme Fatigue · Consumer Wearable</p>
          <p className="sys-item-desc">
            Five independent predictive models trained on {nDays} days of nocturnal
            heart rate data from a Polar Grit X2. Each model selects its own features
            via forward selection across 13 candidates and 3 lag windows. Validated
            with leave-one-out cross-validation on {nPairs} prospective pairs.
            Confidence intervals via 1000× bootstrap.
          </p>
          <p className="sys-stack">Python · scikit-learn · neurokit2 · Polar Grit X2 · GitHub Actions</p>
          <a
            href="https://github.com/kinetica-IA/polar-lyme-predictor"
            target="_blank"
            rel="noopener noreferrer"
            className="sys-link"
          >
            View on GitHub →
          </a>
        </div>
      </div>

      <hr className="sys-divider" />

      {/* Item 02 */}
      <div className="sys-item">
        <span className="sys-num" style={{ color: 'var(--warm)' }}>02</span>
        <div className="sys-content">
          <span className="sys-badge sys-badge--warm">IN PROGRESS · ARCHITECTURE PUBLIC</span>
          <h3 className="sys-item-title">IO3 · Clinical AI Agent</h3>
          <p className="sys-item-sub">LangGraph ReAct Loop · Anthropic Claude · Human-on-Loop</p>
          <p className="sys-item-desc">
            Local-first clinical reasoning agent. 9-node LangGraph graph with Haiku
            for divergent exploration and Sonnet for clinical synthesis. Human-on-loop
            architecture as EU AI Act compliance differentiator. ALMA ethical framework
            for clinical safety boundaries.
          </p>
          <p className="sys-stack">LangGraph · Anthropic Claude · ChromaDB · FastAPI · React</p>
          <a href="/io-architecture.html" className="sys-link">View architecture →</a>
        </div>
      </div>

      <style>{`
        .sys-title {
          font-family: var(--sans);
          font-size: var(--text-section);
          font-weight: 400;
          color: var(--text-heading);
          line-height: 1.35;
          margin: 16px 0 var(--space-subsection);
        }
        .sys-item {
          display: grid;
          grid-template-columns: 48px 1fr;
          gap: 20px;
          align-items: start;
          padding: 4px 0;
          transition: padding-left var(--duration-hover) var(--ease-out);
        }
        @media (max-width: 640px) {
          .sys-item { grid-template-columns: 1fr; }
          .sys-num { margin-bottom: -8px; }
        }
        .sys-num {
          font-family: var(--mono);
          font-size: 2rem;
          font-weight: 400;
          color: var(--teal);
          opacity: 0.35;
          line-height: 1;
        }
        .sys-badge {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          display: inline-block;
          margin-bottom: 8px;
        }
        .sys-badge--green { color: var(--green); background: var(--fill-green); padding: 3px 8px; }
        .sys-badge--warm { color: var(--warm); background: var(--fill-warm); padding: 3px 8px; }
        .sys-item-title {
          font-family: var(--sans);
          font-size: var(--text-subsection);
          font-weight: 500;
          color: var(--text);
          margin-bottom: 4px;
        }
        .sys-item-sub {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          margin-bottom: var(--space-element);
        }
        .sys-item-desc {
          font-size: var(--text-body);
          font-weight: 300;
          color: var(--text-sec);
          line-height: 1.7;
          max-width: 600px;
          margin-bottom: var(--space-element);
        }
        .sys-stack {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          margin-bottom: var(--space-tight);
        }
        .sys-link {
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--sea);
          transition: color var(--duration-hover) ease;
        }
        .sys-link:hover { color: var(--green); }
        .sys-item:hover { padding-left: 4px; }
        .sys-divider {
          border: none;
          border-top: 1px solid var(--border);
          margin: 44px 0;
        }
      `}</style>
    </section>
  )
}
