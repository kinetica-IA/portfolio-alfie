import { useReveal } from '../hooks/useReveal'

/**
 * SectionDivider — Animated line with a center node
 *
 * A thin line that draws from center outward when revealed,
 * with a small colored dot in the middle that pulses.
 * Replaces the static CSS border-top between sections.
 */
export default function SectionDivider({ color = 'var(--teal)', colorRgb = '144,167,165' }) {
  const { ref, revealed } = useReveal(0.3)

  return (
    <div className="sec-divider" ref={ref} aria-hidden="true">
      <span className="sec-div-line sec-div-line--left" style={{
        transform: revealed ? 'scaleX(1)' : 'scaleX(0)',
        transition: 'transform 0.8s var(--ease-out)',
      }} />
      <span className="sec-div-node" style={{
        '--div-color': color,
        '--div-rgb': colorRgb,
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'scale(1)' : 'scale(0)',
        transition: 'opacity 0.4s var(--ease-out) 0.3s, transform 0.4s var(--ease-out) 0.3s',
      }} />
      <span className="sec-div-line sec-div-line--right" style={{
        transform: revealed ? 'scaleX(1)' : 'scaleX(0)',
        transition: 'transform 0.8s var(--ease-out)',
      }} />

      <style>{`
        .sec-divider {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 4px 0;
          margin: 0;
        }
        .sec-div-line {
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .sec-div-line--left { transform-origin: right center; }
        .sec-div-line--right { transform-origin: left center; }
        .sec-div-node {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--div-color);
          flex-shrink: 0;
          margin: 0 8px;
          animation: divPulse 3s ease-in-out infinite;
        }
        @keyframes divPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(var(--div-rgb), 0.3); }
          50% { box-shadow: 0 0 0 4px rgba(var(--div-rgb), 0); }
        }
      `}</style>
    </div>
  )
}
