import { useReveal } from '../hooks/useReveal'

export default function Reveal({ children, delay = 0, className = '' }) {
  const { ref, revealed } = useReveal(0.25)
  return (
    <div
      ref={ref}
      className={`reveal-base ${revealed ? 'revealed' : ''} ${className}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  )
}
