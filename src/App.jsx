import TopBar from './components/TopBar'
import Hero from './components/Hero'
import FounderContact from './components/FounderContact'
import FooterField from './components/FooterField'
import SectionDivider from './components/SectionDivider'

export default function App() {
  return (
    <>
      <TopBar />
      <div className="content-layer">
        <Hero />
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
