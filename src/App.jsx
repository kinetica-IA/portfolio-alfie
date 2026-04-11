import { usePolarData } from './hooks/usePolarData'
import { FloatingDecorators } from './components/OrganicSymbols'
import FilmGrain from './components/FilmGrain'
import TopBar from './components/TopBar'
import Hero from './components/Hero'
import Work from './components/Work'
import About from './components/About'
import Research from './components/Research'
import Contact from './components/Contact'
import FooterField from './components/FooterField'
import SectionDivider from './components/SectionDivider'
import Reveal from './components/Reveal'

export default function App() {
  const { data, loading } = usePolarData()

  return (
    <>
      <TopBar />
      <FloatingDecorators />
      <FilmGrain />
      <div className="content-layer">
        <Hero />
        <SectionDivider color="var(--sea)" colorRgb="93,138,130" />
        <Reveal>
          <Work data={data} />
        </Reveal>
        <SectionDivider color="var(--teal)" colorRgb="144,167,165" />
        <Reveal delay={0.1}>
          <About />
        </Reveal>
        <SectionDivider color="var(--green)" colorRgb="107,158,122" />
        <Reveal>
          <Research data={data} loading={loading} />
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
