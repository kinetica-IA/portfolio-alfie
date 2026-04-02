export default function ClinicalSignal() {
  return (
    <section className="section clinical-signal">
      <span className="eyebrow" style={{ color: 'var(--teal)' }}>THE CLINICAL QUESTION</span>
      <h2 className="cs-headline">
        The signal lives in the autonomic nervous system.
        <br />Not in sleep. Not in serology.
      </h2>
      <p className="cs-body">
        Conventional monitoring misses post-infectious fatigue because it looks in the wrong place.
        We extract predictive signal from nocturnal heart rate variability — the autonomic fingerprint
        the body writes every night.
      </p>

      <style>{`
        .clinical-signal {
          max-width: 680px;
        }
        .clinical-signal .eyebrow {
          display: block;
          margin-bottom: 16px;
        }
        .cs-headline {
          font-family: var(--sans);
          font-size: var(--text-section);
          font-weight: 400;
          color: var(--text);
          line-height: 1.35;
          margin-bottom: 28px;
        }
        .cs-body {
          font-family: var(--sans);
          font-size: var(--text-body);
          font-weight: 300;
          color: var(--text-sec);
          line-height: 1.75;
          border-left: 2px solid var(--green);
          padding-left: 20px;
          max-width: 560px;
        }
      `}</style>
    </section>
  )
}
