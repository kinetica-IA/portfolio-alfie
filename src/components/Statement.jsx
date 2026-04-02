import CornerMarks from './CornerMarks'

export default function Statement({ text }) {
  return (
    <div className="statement">
      <div className="statement-inner">
        <CornerMarks size={18} stroke={1.5} color="var(--accent)" opacity={0.3} />
        <p className="statement-text">{text}</p>
      </div>

      <style>{`
        .statement {
          padding: 80px 40px;
          text-align: center;
        }
        .statement-inner {
          position: relative;
          max-width: 700px;
          margin: 0 auto;
          padding: 40px 32px;
        }
        .statement-text {
          font-family: var(--sans);
          font-weight: 400;
          font-size: clamp(1.5rem, 3vw, 2.2rem);
          color: var(--text);
          line-height: 1.5;
        }
        @media (max-width: 768px) {
          .statement { padding: 48px 20px; }
        }
      `}</style>
    </div>
  )
}
