import { useState } from 'react'

const NODES = [
  { id: 'polar', label: 'Polar Grit X2', eyebrow: '01 · DATA', cat: 'pre', tooltip: 'Consumer wearable. Continuous nocturnal RR interval recording via optical PPG sensor.' },
  { id: 'extract', label: 'RR Extract', eyebrow: '02 · EXTRACT', cat: 'pre', tooltip: '193 valid nights extracted from Polar GDPR export. Artifact filtering: NN intervals, 300-2000ms range.' },
  { id: 'neurokit', label: 'neurokit2', eyebrow: '03 · COMPUTE', cat: 'loop', tooltip: '8 advanced HRV metrics per night: SDNN, pNN50, LF/HF, HF power, SD1, SD2, DFA-α1, RMSSD.' },
  { id: 'features', label: 'Feature Matrix', eyebrow: '04 · BUILD', cat: 'loop', tooltip: '13 candidate features × 3 lag windows (t0, t-1, t-2). Merged with 7-domain clinical diary.' },
  { id: 'selection', label: 'Forward Select', eyebrow: '05 · SELECT', cat: 'loop', tooltip: 'Per-target greedy forward selection. Max 5 features. Stop when AUC gain < 0.01.' },
  { id: 'validation', label: 'LOO-CV', eyebrow: '06 · VALIDATE', cat: 'gap', tooltip: 'Leave-One-Out cross-validation. N-1 train, 1 test, N iterations. Zero data leakage.' },
  { id: 'bootstrap', label: 'Bootstrap CI', eyebrow: '07 · QUANTIFY', cat: 'gap', tooltip: '1000× bootstrap resampling of LOO predictions for 95% confidence intervals on AUC.' },
  { id: 'predictions', label: '5 Predictions', eyebrow: '08 · OUTPUT', cat: 'synth', tooltip: 'Independent models for severity, PEM, fatigue, brain fog, and autonomic dysfunction.' },
]

const CAT_COLORS = {
  pre: '#6a8690',
  loop: '#6b9e7a',
  gap: '#c4855a',
  synth: '#d4a843',
}

const NODE_W = 100
const NODE_H = 44
const GAP = 16
const START_X = 16
const START_Y = 34

export default function PipelineDiagram() {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const totalW = START_X * 2 + NODES.length * NODE_W + (NODES.length - 1) * GAP
  const totalH = 130

  return (
    <section className="section" id="pipeline">
      <div className="eyebrow" style={{ marginBottom: 16 }}>DATA PIPELINE</div>

      <div className="pipeline-scroll">
        <svg
          viewBox={`0 0 ${totalW} ${totalH}`}
          width="100%"
          style={{ maxWidth: totalW, display: 'block' }}
        >
          {/* Edges */}
          {NODES.slice(0, -1).map((_, i) => {
            const x1 = START_X + i * (NODE_W + GAP) + NODE_W
            const x2 = START_X + (i + 1) * (NODE_W + GAP)
            const y = START_Y + NODE_H / 2
            return (
              <path
                key={`edge-${i}`}
                d={`M${x1},${y} C${x1 + GAP / 2},${y} ${x2 - GAP / 2},${y} ${x2},${y}`}
                fill="none"
                stroke="rgba(144,167,165,0.25)"
                strokeWidth="1.5"
              />
            )
          })}

          {/* Nodes */}
          {NODES.map((node, i) => {
            const x = START_X + i * (NODE_W + GAP)
            const y = START_Y
            const color = CAT_COLORS[node.cat]
            const isHovered = hoveredIdx === i

            return (
              <g
                key={node.id}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Eyebrow */}
                <text
                  x={x + NODE_W / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fontFamily="'DM Mono', monospace"
                  fontSize="7"
                  fill="#7a8e8c"
                  letterSpacing="0.06em"
                >
                  {node.eyebrow}
                </text>

                {/* Node rect */}
                <rect
                  x={x}
                  y={y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={8}
                  fill={isHovered ? color : 'rgba(255,255,255,0.85)'}
                  stroke={color}
                  strokeWidth={isHovered ? 2 : 1.5}
                  style={{ transition: 'all 0.2s ease' }}
                />

                {/* Label */}
                <text
                  x={x + NODE_W / 2}
                  y={y + NODE_H / 2 + 4}
                  textAnchor="middle"
                  fontFamily="'DM Mono', monospace"
                  fontSize="9"
                  fontWeight="500"
                  fill={isHovered ? '#fff' : '#1a2a28'}
                  style={{ transition: 'fill 0.2s ease' }}
                >
                  {node.label}
                </text>

                {/* Tooltip */}
                {isHovered && (
                  <foreignObject
                    x={Math.max(0, x - 20)}
                    y={y + NODE_H + 8}
                    width={160}
                    height={80}
                  >
                    <div style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '8.5px',
                      lineHeight: '1.4',
                      color: '#4a5e5c',
                      background: 'rgba(255,255,255,0.95)',
                      border: '1px solid rgba(144,167,165,0.18)',
                      borderRadius: '6px',
                      padding: '8px',
                      backdropFilter: 'blur(4px)',
                    }}>
                      {node.tooltip}
                    </div>
                  </foreignObject>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      <style>{`
        .pipeline-scroll {
          overflow-x: auto;
          padding-bottom: 8px;
          -webkit-overflow-scrolling: touch;
        }
        .pipeline-scroll::-webkit-scrollbar {
          height: 4px;
        }
        .pipeline-scroll::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 2px;
        }
      `}</style>
    </section>
  )
}
