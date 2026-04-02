/**
 * CrossGrid — Static "+" grid texture behind content.
 * CSS-only, no canvas overhead.
 */
export default function CrossGrid() {
  return (
    <div className="cross-grid" aria-hidden="true">
      <style>{`
        .cross-grid {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-image:
            radial-gradient(circle, var(--accent) 0.8px, transparent 0.8px);
          background-size: 60px 60px;
          opacity: 0.04;
        }
        .cross-grid::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(0deg, var(--accent) 1px, transparent 1px),
            linear-gradient(90deg, var(--accent) 1px, transparent 1px);
          background-size: 60px 60px;
          background-position: 30px 30px;
          opacity: 0.3;
          mask-image: radial-gradient(circle, var(--accent) 0.6px, transparent 0.6px);
          mask-size: 60px 60px;
          -webkit-mask-image: radial-gradient(circle, var(--accent) 0.6px, transparent 0.6px);
          -webkit-mask-size: 60px 60px;
        }
      `}</style>
    </div>
  )
}
