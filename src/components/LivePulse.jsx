import { useReveal } from '../hooks/useReveal'

/**
 * LivePulse — thin inline ribbon under the hero.
 * One mono line: live dot · last sync · mini sparkline · nights count.
 * No card, no border. The signal is the design.
 */

function miniSparkline(series, key, width, height) {
  if (!series || series.length < 2) return { path: '', last: null, length: 0 }
  const recent = series.filter(d => d[key] != null).slice(-30)
  if (recent.length < 2) return { path: '', last: null, length: 0 }

  const values = recent.map(d => d[key])
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = width / (values.length - 1)

  const points = values.map((v, i) => {
    const x = i * step
    const y = height - ((v - min) / range) * (height - 2) - 1
    return { x, y }
  })
  const path = 'M' + points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' L')
  return { path, last: points[points.length - 1], length: points.length }
}

export default function LivePulse({ data }) {
  const { ref, revealed } = useReveal(0.2)

  if (!data?.series?.length) return null

  const series = data.series
  const updatedAt = data.updated_at
  const updatedDate = updatedAt ? new Date(updatedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }) : null

  const SPARK_W = 140
  const SPARK_H = 18
  const { path: sparkPath, last: sparkLast } = miniSparkline(series, 'hrv_rmssd_night', SPARK_W, SPARK_H)

  return (
    <div
      className="live-ribbon"
      ref={ref}
      style={{
        opacity: revealed ? 1 : 0,
        transition: 'opacity 0.6s var(--ease-out) 0.2s',
      }}
    >
      <span className="lr-dot" aria-hidden="true" />
      <span className="lr-live">live</span>
      {updatedDate && (
        <>
          <span className="lr-sep">·</span>
          <span className="lr-text">synced {updatedDate}</span>
        </>
      )}
      {sparkPath && (
        <>
          <span className="lr-sep">·</span>
          <svg
            className="lr-spark"
            viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
            preserveAspectRatio="none"
            aria-label="RMSSD 30-day trace"
          >
            <defs>
              <linearGradient id="lrGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#5d8a82" />
                <stop offset="55%"  stopColor="#90a7a5" />
                <stop offset="100%" stopColor="#6b9e7a" />
              </linearGradient>
              <linearGradient id="lrGradGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#5d8a82" stopOpacity="0" />
                <stop offset="50%"  stopColor="#6b9e7a" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#90a7a5" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* soft underlay halo */}
            <path
              d={sparkPath}
              fill="none"
              stroke="url(#lrGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.18"
            />
            {/* main trace */}
            <path
              d={sparkPath}
              fill="none"
              stroke="url(#lrGrad)"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* travelling sweep highlight */}
            <path
              className="lr-sweep"
              d={sparkPath}
              fill="none"
              stroke="url(#lrGradGlow)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* pulsing endpoint */}
            {sparkLast && (
              <>
                <circle
                  className="lr-endpoint-halo"
                  cx={sparkLast.x}
                  cy={sparkLast.y}
                  r="2.5"
                  fill="#6b9e7a"
                />
                <circle
                  cx={sparkLast.x}
                  cy={sparkLast.y}
                  r="1.4"
                  fill="#6b9e7a"
                />
              </>
            )}
          </svg>
        </>
      )}
      <span className="lr-sep">·</span>
      <span className="lr-text">
        <strong>{series.length}</strong> nights
      </span>

      <style>{`
        .live-ribbon {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin: 16px auto 28px;
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          letter-spacing: 0.06em;
        }
        .lr-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--sea);
          flex-shrink: 0;
          animation: lrDotPulse 2.2s ease-in-out infinite;
        }
        @keyframes lrDotPulse {
          0%, 100% { opacity: 0.45; box-shadow: 0 0 0 0 rgba(93,138,130,0.45); }
          50%      { opacity: 1;   box-shadow: 0 0 0 5px rgba(93,138,130,0); }
        }
        .lr-live {
          color: var(--sea);
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: lowercase;
        }
        .lr-sep {
          opacity: 0.4;
        }
        .lr-text strong {
          font-weight: 500;
          color: var(--green);
          margin-right: 3px;
        }
        .lr-spark {
          width: 130px;
          height: 18px;
          display: block;
          overflow: visible;
        }
        .lr-sweep {
          stroke-dasharray: 28 260;
          stroke-dashoffset: 260;
          animation: lrSweep 3.6s linear infinite;
        }
        @keyframes lrSweep {
          0%   { stroke-dashoffset: 260; opacity: 0.0; }
          12%  { opacity: 0.95; }
          88%  { opacity: 0.95; }
          100% { stroke-dashoffset: -40; opacity: 0.0; }
        }
        .lr-endpoint-halo {
          transform-origin: center;
          transform-box: fill-box;
          animation: lrEndpoint 2.2s ease-in-out infinite;
        }
        @keyframes lrEndpoint {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50%      { opacity: 0.85; transform: scale(1.9); }
        }
        @media (max-width: 480px) {
          .live-ribbon { gap: 8px; font-size: 0.65rem; }
          .lr-spark { width: 100px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .lr-dot, .lr-sweep, .lr-endpoint-halo { animation: none; }
        }
      `}</style>
    </div>
  )
}
