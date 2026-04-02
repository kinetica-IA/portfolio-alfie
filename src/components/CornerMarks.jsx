/**
 * CornerMarks — Registration-style L-shapes at card corners.
 * Replaces border-radius entirely.
 */
export default function CornerMarks({ size = 14, stroke = 1.5, color = 'var(--accent)', opacity = 0.3 }) {
  const s = size
  const style = {
    position: 'absolute',
    width: s,
    height: s,
    pointerEvents: 'none',
  }
  const pathStyle = {
    stroke: color,
    strokeWidth: stroke,
    fill: 'none',
    opacity,
  }

  return (
    <>
      {/* Top-left */}
      <svg style={{ ...style, top: 0, left: 0 }} viewBox={`0 0 ${s} ${s}`}>
        <path d={`M0,${s} L0,0 L${s},0`} style={pathStyle} />
      </svg>
      {/* Top-right */}
      <svg style={{ ...style, top: 0, right: 0 }} viewBox={`0 0 ${s} ${s}`}>
        <path d={`M0,0 L${s},0 L${s},${s}`} style={pathStyle} />
      </svg>
      {/* Bottom-left */}
      <svg style={{ ...style, bottom: 0, left: 0 }} viewBox={`0 0 ${s} ${s}`}>
        <path d={`M0,0 L0,${s} L${s},${s}`} style={pathStyle} />
      </svg>
      {/* Bottom-right */}
      <svg style={{ ...style, bottom: 0, right: 0 }} viewBox={`0 0 ${s} ${s}`}>
        <path d={`M${s},0 L${s},${s} L0,${s}`} style={pathStyle} />
      </svg>
    </>
  )
}
