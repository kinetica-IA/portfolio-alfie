import Hero from './components/Hero'
import FounderContact from './components/FounderContact'
import SectionDivider from './components/SectionDivider'
import InformesPreview from './components/InformesPreview'
import LabPreview from './components/LabPreview'

export default function App({ informes = [], lab = [] }) {
  return (
    <>
      <Hero />
      <SectionDivider color="var(--sea)" colorRgb="93,138,130" />
      <InformesPreview items={informes} />
      <SectionDivider color="var(--teal)" colorRgb="144,167,165" />
      <LabPreview items={lab} />
      <SectionDivider color="var(--clay)" colorRgb="168,121,110" />
      <FounderContact />
    </>
  )
}
