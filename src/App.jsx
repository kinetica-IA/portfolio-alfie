import { usePolarData } from './hooks/usePolarData'
import TopologicalMesh from './components/TopologicalMesh'
import CrossGrid from './components/CrossGrid'
import Landing from './components/Landing'
import ArticleCards from './components/ArticleCards'
import Statement from './components/Statement'
import PipelineDiagram from './components/PipelineDiagram'
import ProjectCards from './components/ProjectCards'
import Founder from './components/Founder'
import Services from './components/Services'
import Contact from './components/Contact'
import Reveal from './components/Reveal'

export default function App() {
  const { data, loading } = usePolarData()

  return (
    <>
      <CrossGrid />
      <TopologicalMesh />
      <div className="content-layer">
        <Landing data={data} />
        <div className="content-sections">
          <Reveal>
            <ArticleCards data={data} loading={loading} />
          </Reveal>

          <Reveal>
            <Statement text="193 nights. 8 HRV metrics. 5 predictions. Zero hospital visits." />
          </Reveal>

          <Reveal delay={0.1}>
            <PipelineDiagram />
          </Reveal>

          <Reveal delay={0.1}>
            <ProjectCards data={data} />
          </Reveal>

          <Reveal>
            <Statement text="The signal lives in the autonomic nervous system. Not in sleep. Not in serology." />
          </Reveal>

          <Reveal delay={0.15}>
            <Founder />
          </Reveal>

          <Reveal delay={0.1}>
            <Services />
          </Reveal>

          <Reveal delay={0.05}>
            <Contact />
          </Reveal>
        </div>
      </div>

      <style>{`
        .content-layer {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 40px;
        }
        .content-sections {
          background: rgba(240, 249, 249, 0.88);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 0;
          padding: 0 40px;
          border: 1px solid var(--border);
        }
        @media (max-width: 768px) {
          .content-layer { padding: 0 20px; }
          .content-sections { padding: 0 20px; }
        }
      `}</style>
    </>
  )
}
