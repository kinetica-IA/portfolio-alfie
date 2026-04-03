import { useReveal } from '../hooks/useReveal'

/**
 * LivePulse — Mini sparkline + live data badge
 *
 * Shows the last 30 nights of RMSSD as a tiny sparkline SVG,
 * plus the latest sync date and a "live" indicator.
 * Data comes from polar_live.json via parent.
 */

function miniSparkline(series, key, width, height) {
  if (!series || series.length < 2) return ''
  // Take last 30 entries that have the key
  const recent = series.filter(d => d[key] != null).slice(-30)
  if (recent.length < 2) return ''

  const values = recent.map(d => d[key])
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = width / (values.length - 1)

  const points = values.map((v, i) => {
    const x = i * step
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  })
  return `M${points.join(' L')}`
}

export default function LivePulse({ data }) {
  const { ref, revealed } = useReveal(0.2)

  if (!data?.series?.length) return null

  const series = data.series
  const latest = data.latest || series[series.length - 1]
  const updatedAt = data.updated_at
  const updatedDate = updatedAt ? new Date(updatedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }) : null

  const rmssd = latest?.hrv_rmssd_night ?? latest?.hrv_rmssd_daily
  const sleepScore = latest?.sleep_score
  const sparkPath = miniSparkline(series, 'hrv_rmssd_daily', 120, 28)

  return (
    <div
      className="live-pulse"
      ref={ref}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.5s var(--ease-out) 0.3s, transform 0.5s var(--ease-out) 0.3s',
      }}
    >
      <div className="lp-header">
        <span className="lp-live-dot" />
        <span className="lp-label">LIVE DATA</span>
        {updatedDate && <span className="lp-date">Last sync: {updatedDate}</span>}
      </div>

      <div className="lp-body">
        {sparkPath && (
          <div className="lp-spark-wrap">
            <svg className="lp-spark" viewBox={`0 0 120 28`} preserveAspectRatio="none">
              <path d={sparkPath} fill="none" stroke="var(--sea)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              {/* Animated trailing glow */}
              <path d={sparkPath} fill="none" stroke="var(--sea)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.15" />
            </svg>
            <span className="lp-spark-label">RMSSD 30d</span>
          </div>
        )}

        <div className="lp-stats">
          {rmssd != null && (
            <div className="lp-stat">
              <span className="lp-stat-value" style={{ color: 'var(--sea)' }}>{rmssd.toFixed(0)}</span>
              <span className="lp-stat-key">RMSSD<sub>night</sub></span>
            </div>
          )}
          {sleepScore != null && (
            <div className="lp-stat">
              <span className="lp-stat-value" style={{ color: 'var(--teal)' }}>{sleepScore.toFixed(0)}</span>
              <span className="lp-stat-key">Sleep score</span>
            </div>
          )}
          <div className="lp-stat">
            <span className="lp-stat-value" style={{ color: 'var(--green)' }}>{series.length}</span>
            <span className="lp-stat-key">Total nights</span>
          </div>
        </div>
      </div>

      <style>{`
        .live-pulse {
          margin-top: 32px;
          margin-bottom: 48px;
          padding: 20px 24px;
          border: 1px solid var(--border);
          border-left: 3px solid var(--sea);
          background: rgba(93, 138, 130, 0.03);
        }
        .lp-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .lp-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--sea);
          animation: lpDotPulse 2s ease-in-out infinite;
        }
        @keyframes lpDotPulse {
          0%, 100% { opacity: 0.4; box-shadow: 0 0 0 0 rgba(93,138,130,0.4); }
          50% { opacity: 1; box-shadow: 0 0 0 4px rgba(93,138,130,0); }
        }
        .lp-label {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          font-weight: 500;
          letter-spacing: 0.08em;
          color: var(--sea);
        }
        .lp-date {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          margin-left: auto;
        }
        .lp-body {
          display: flex;
          align-items: center;
          gap: 32px;
          flex-wrap: wrap;
        }
        .lp-spark-wrap {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .lp-spark {
          width: 120px;
          height: 28px;
          display: block;
        }
        .lp-spark-label {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .lp-stats {
          display: flex;
          gap: 24px;
        }
        .lp-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .lp-stat-value {
          font-family: var(--mono);
          font-size: 1.4rem;
          font-weight: 500;
          line-height: 1;
        }
        .lp-stat-key {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .lp-stat-key sub {
          font-size: var(--text-eyebrow);
          vertical-align: baseline;
        }
        @media (max-width: 640px) {
          .lp-body { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  )
}
