import { usePolarData } from './hooks/usePolarData'
import ArchitecturalGrid from './components/ArchitecturalGrid'
import Hero from './components/Hero'
import ClinicalSignal from './components/ClinicalSignal'
import FlagshipProof from './components/FlagshipProof'
import Founder from './components/Founder'
import Systems from './components/Systems'
import Contact from './components/Contact'
import Reveal from './components/Reveal'

export default function App() {
  const { data, loading } = usePolarData()

  return (
    <>
      <ArchitecturalGrid />
      <div className="content-layer">
        <Hero />
        <Reveal>
          <ClinicalSignal />
        </Reveal>
        <Reveal>
          <FlagshipProof data={data} loading={loading} />
        </Reveal>
        <Reveal delay={0.1}>
          <Founder />
        </Reveal>
        <Reveal delay={0.1}>
          <Systems data={data} />
        </Reveal>
        <Reveal delay={0.05}>
          <Contact />
        </Reveal>
      </div>

      <style>{`
        .content-layer {
          position: relative;
          z-index: 1;
          max-width: 960px;
          margin: 0 auto;
          padding: 0 48px;
        }
        @media (max-width: 768px) {
          .content-layer { padding: 0 24px; }
        }
      `}</style>
    </>
  )
}
