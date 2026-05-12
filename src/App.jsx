import { usePolarData } from './hooks/usePolarData'
import TopBar from './components/TopBar'
import Hero from './components/Hero'
import LivePulse from './components/LivePulse'
import Pipeline from './components/Pipeline'
import Predictors from './components/Predictors'
import Frameworks from './components/Frameworks'
import OpenResearch from './components/OpenResearch'
import FounderContact from './components/FounderContact'
import FooterField from './components/FooterField'
import SectionDivider from './components/SectionDivider'

export default function App() {
  const { data, loading } = usePolarData()

  return (
    <>
      <TopBar />
      <div className="content-layer">
        <Hero />
        {data && <LivePulse data={data} />}
        <SectionDivider color="var(--green)" colorRgb="107,158,122" />
        <Pipeline />
        <SectionDivider color="var(--sea)" colorRgb="93,138,130" />
        <Predictors />
        <SectionDivider color="var(--teal)" colorRgb="144,167,165" />
        <Frameworks />
        <SectionDivider color="var(--ice)" colorRgb="133,168,184" />
        <OpenResearch />
        <SectionDivider color="var(--clay)" colorRgb="168,121,110" />
        <FounderContact />
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
