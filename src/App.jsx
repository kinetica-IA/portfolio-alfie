import { usePolarData } from './hooks/usePolarData'
import ClinicalField from './components/ClinicalField'
import { FloatingDecorators } from './components/OrganicSymbols'
import Hero from './components/Hero'
import ClinicalSignal from './components/ClinicalSignal'
import FlagshipProof from './components/FlagshipProof'
import Founder from './components/Founder'
import Systems from './components/Systems'
import Published from './components/Published'
import Contact from './components/Contact'
import FooterField from './components/FooterField'
import SectionDivider from './components/SectionDivider'
import Reveal from './components/Reveal'

export default function App() {
  const { data, loading } = usePolarData()

  return (
    <>
      <ClinicalField />
      <FloatingDecorators />
      <div className="content-layer">
        <Hero />
        <SectionDivider color="var(--sea)" colorRgb="93,138,130" />
        <Reveal>
          <ClinicalSignal />
        </Reveal>
        <SectionDivider color="var(--green)" colorRgb="107,158,122" />
        <Reveal>
          <FlagshipProof data={data} loading={loading} />
        </Reveal>
        <SectionDivider color="var(--teal)" colorRgb="144,167,165" />
        <Reveal delay={0.1}>
          <Founder />
        </Reveal>
        <SectionDivider color="var(--warm)" colorRgb="196,133,90" />
        <Reveal delay={0.1}>
          <Systems data={data} />
        </Reveal>
        <SectionDivider color="var(--green)" colorRgb="107,158,122" />
        <Reveal>
          <Published />
        </Reveal>
        <SectionDivider color="var(--sea)" colorRgb="93,138,130" />
        <Reveal delay={0.05}>
          <Contact />
        </Reveal>
      </div>
      <FooterField />

      <style>{`
        .content-layer {
          position: relative;
          z-index: 1;
          max-width: 960px;
          margin: 0 auto;
          padding: 0 48px;
        }
        @media (max-width: 768px) {
          .content-layer { padding: 0 20px; }
        }
        @media (max-width: 420px) {
          .content-layer { padding: 0 16px; }
        }
      `}</style>
    </>
  )
}
