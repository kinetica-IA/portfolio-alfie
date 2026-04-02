import CornerMarks from './CornerMarks'

const GITHUB = 'https://github.com/kinetica-IA/polar-lyme-predictor'

function buildArticles(data) {
  const t = data?.predictor?.targets || {}
  const r = data?.predictor?.residuals || {}
  const nDays = data?.series?.length || '200+'
  const nPairs = data?.predictor?.n_training || 60

  return [
    {
      num: '01',
      numColor: 'var(--accent)',
      eyebrow: 'RESEARCH · MODEL V3',
      title: 'Five symptoms, one watch, zero hospital visits',
      data: [
        `AUC ${t.severity?.best_auc?.toFixed(2) || '0.84'} severity`,
        `AUC ${t.disfuncion_autonomica?.best_auc?.toFixed(2) || '0.86'} autonomic dysfunction`,
        `AUC ${t.pem?.best_auc?.toFixed(2) || '0.79'} post-exertional malaise`,
        `AUC ${t.fatiga?.best_auc?.toFixed(2) || '0.79'} fatigue`,
        `AUC ${t.niebla_mental?.best_auc?.toFixed(2) || '0.99'} brain fog \u26A0`,
      ],
      cta: { text: 'View methodology \u2192', link: GITHUB },
    },
    {
      num: '02',
      numColor: 'var(--gold)',
      eyebrow: 'KEY FINDING · PHYSIOLOGICAL COHERENCE',
      title: 'The model found what neurology predicts',
      data: [
        `AUC ${t.disfuncion_autonomica?.best_auc?.toFixed(2) || '0.86'} [${t.disfuncion_autonomica?.best_auc_ci95?.[0]?.toFixed(2) || '0.75'}, ${t.disfuncion_autonomica?.best_auc_ci95?.[1]?.toFixed(2) || '0.95'}]`,
        'LF/HF ratio (sympathovagal balance, lag-1)',
        'SD1 Poincar\u00E9 (beat-to-beat variability, lag-0)',
        'Only target using neurokit2-derived features',
      ],
      cta: { text: 'How we extracted these \u2192', link: GITHUB },
    },
    {
      num: '03',
      numColor: 'var(--accent)',
      eyebrow: 'COGNITIVE PHENOTYPING',
      title: "The model\u2019s failure is the finding",
      data: [
        `Brain fog \u03C1 = +${r.brain_fog?.rho || '0.547'}, p < 0.001`,
        `Autonomic \u03C1 = +${r.autonomic_dysfunction?.rho || '0.372'}, p = 0.006`,
        'Residuals capture what the patient cannot articulate',
      ],
      cta: { text: 'Read the analysis \u2192', link: GITHUB },
    },
    {
      num: '04',
      numColor: 'var(--accent)',
      eyebrow: 'DATA INTEGRITY',
      title: "The worst days have no data \u2014 and that\u2019s the point",
      data: [
        `${nDays}+ days continuously monitored`,
        `${nPairs} prospective pairs used`,
        '0 retroactive entries fabricated',
        'Missing data is MNAR, not random',
      ],
      cta: null,
    },
    {
      num: '05',
      numColor: 'var(--accent)',
      eyebrow: 'FEATURE ENGINEERING',
      title: 'Same data, fewer features, better predictions',
      data: [
        'v2: AUC 0.70 with 4 fixed features',
        'v3: AUC 0.84 with 2 auto-selected features',
        '13 candidates \u00D7 3 lag windows \u00D7 5 targets',
        'Forward selection stops when gain < 0.01',
      ],
      cta: null,
    },
    {
      num: '06',
      numColor: 'var(--accent)',
      eyebrow: 'OPEN SOURCE',
      title: 'From heartbeat to prediction in one push',
      data: [
        '193 nights of RR intervals extracted',
        '8 HRV metrics computed via neurokit2',
        '5 independent models retrained per diary entry',
        '~30 seconds end-to-end',
      ],
      cta: { text: 'Source code \u2192', link: GITHUB },
    },
  ]
}

export default function ArticleCards({ data, loading }) {
  const articles = buildArticles(data)

  return (
    <section className="section" id="research">
      <div className="eyebrow" style={{ marginBottom: 12 }}>RESEARCH FINDINGS</div>

      {loading ? (
        <p className="ac-loading">Loading data...</p>
      ) : (
        <div className="ac-grid">
          {articles.map(a => (
            <article key={a.num} className="ac">
              <CornerMarks size={16} stroke={1.5} color="var(--accent)" opacity={0.35} />
              <span className="ac-num" style={{ color: a.numColor }}>{a.num}</span>
              <div className="ac-eyebrow eyebrow">{a.eyebrow}</div>
              <h3 className="ac-title">{a.title}</h3>
              <div className="ac-data">
                {a.data.map((d, i) => <div key={i} className="ac-datum">{d}</div>)}
              </div>
              {a.cta && (
                <a href={a.cta.link} target="_blank" rel="noopener noreferrer" className="ac-cta">
                  {a.cta.text}
                </a>
              )}
            </article>
          ))}
        </div>
      )}

      <style>{`
        .ac-loading {
          color: var(--text-dim);
          font-family: var(--mono);
          font-size: 12px;
        }
        .ac-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        @media (max-width: 768px) {
          .ac-grid { grid-template-columns: 1fr; }
        }
        .ac {
          position: relative;
          background: rgba(14, 20, 20, 0.55);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid var(--border);
          border-radius: 0;
          padding: 28px;
          transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
          overflow: hidden;
        }
        .ac:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(26,42,40,0.08);
          background: rgba(19, 26, 26, 0.75);
        }
        .ac-num {
          display: block;
          font-family: var(--mono);
          font-size: 2.5rem;
          font-weight: 400;
          opacity: 0.45;
          line-height: 1;
          margin-bottom: 12px;
        }
        .ac-eyebrow {
          margin-bottom: 8px;
        }
        .ac-title {
          font-family: var(--sans);
          font-weight: 500;
          font-size: 1.4rem;
          color: var(--text);
          line-height: 1.3;
          margin-bottom: 16px;
        }
        .ac-data {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 16px;
        }
        .ac-datum {
          font-family: var(--mono);
          font-size: 13px;
          color: var(--text-sec);
          line-height: 1.5;
        }
        .ac-cta {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--green);
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s ease;
        }
        .ac-cta:hover {
          border-bottom-color: var(--green);
        }
      `}</style>
    </section>
  )
}
