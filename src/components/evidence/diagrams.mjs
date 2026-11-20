// Data and geometry for the four case diagrams (ProjectDiagram.astro).
//
// Every step states a fact taken from one of these files only:
//   - src/data/portfolio.json
//   - scripts/polar/README.md
//   - scripts/editorial/README.md
//   - .github/workflows/deploy.yml
//   - package.json (stack of the website only)
// Each step carries `sources` and a comment with the same path. Files are cited as
// path:line; portfolio.json is cited by entry id and field (path#id.field[i]) because
// its line numbers change when other fields are added.
// Pure module: no DOM, no Astro. Imported by the component and by node:test.

export const SLUGS = ['website', 'prompt-lab', 'polar', 'editorial-checker']

export const DIAGRAMS = {
  // ── Website ──────────────────────────────────────────────────────────
  website: {
    kind: 'flow',
    title: 'How the website is built and published',
    desc:
      'Five-step flow: Astro and React source, a push to main or a manual run, ' +
      'a GitHub Actions build with Node 22, the dist folder uploaded as a Pages artifact, ' +
      'and deployment to GitHub Pages.',
    steps: [
      {
        // Source: package.json (dependencies and devDependencies)
        label: 'Astro + React source',
        title: 'Astro + React source',
        detail: 'Static site built with Astro 6 and React 19 components.',
        sources: ['package.json:14-22'],
      },
      {
        // Source: .github/workflows/deploy.yml:3-10
        label: 'Push to main or manual run',
        title: 'Trigger',
        detail: 'The workflow starts on a push to the main branch or when it is run manually.',
        sources: ['.github/workflows/deploy.yml:3-10'],
      },
      {
        // Source: .github/workflows/deploy.yml:21-44
        label: 'GitHub Actions build',
        title: 'GitHub Actions build',
        detail: 'On ubuntu-latest: checkout, Node 22, npm ci, then npm run build.',
        sources: ['.github/workflows/deploy.yml:21-44'],
      },
      {
        // Source: .github/workflows/deploy.yml:46-49
        label: 'Upload dist/ as Pages artifact',
        title: 'Pages artifact',
        detail: 'The build output in ./dist is uploaded as the GitHub Pages artifact.',
        sources: ['.github/workflows/deploy.yml:46-49'],
      },
      {
        // Source: .github/workflows/deploy.yml:51-60
        label: 'Deploy to GitHub Pages',
        title: 'GitHub Pages',
        detail: 'A separate deploy job, which needs the build job, publishes the artifact to GitHub Pages.',
        sources: ['.github/workflows/deploy.yml:51-60'],
      },
    ],
  },

  // ── Prompt Lab ───────────────────────────────────────────────────────
  'prompt-lab': {
    kind: 'flow',
    title: 'How Prompt Lab v0.4 reviews a prompt',
    desc:
      'Five-step flow: a prompt and its task go to the v0.4 auditor, which either keeps the prompt, ' +
      'asks to clarify, or proposes a justified change; the output contract is checked automatically; ' +
      'a human verdict follows, with partial coverage.',
    steps: [
      {
        // Source: src/data/portfolio.json (prompt-lab.flow[0], prompt-lab.intro)
        label: 'Prompt + task',
        title: 'Prompt and task',
        detail: 'The input is a prompt together with the task it serves and its constraints.',
        sources: ['src/data/portfolio.json#prompt-lab.intro', 'src/data/portfolio.json#prompt-lab.flow[0]'],
      },
      {
        // Source: src/data/portfolio.json (prompt-lab.evidence[0], prompt-lab.status)
        label: 'Auditor v0.4',
        title: 'Auditor v0.4',
        detail: 'The published v0.4 auditor reviews the prompt against explicit criteria.',
        sources: ['src/data/portfolio.json#prompt-lab.status', 'src/data/portfolio.json#prompt-lab.evidence[0]'],
      },
      {
        // Source: src/data/portfolio.json (prompt-lab.intro)
        label: 'Decision',
        title: 'Decision',
        detail: 'It keeps a prompt that already meets the goal, asks to clarify, or proposes a justified change.',
        branches: ['Keep', 'Ask to clarify', 'Propose justified change'],
        sources: ['src/data/portfolio.json#prompt-lab.intro'],
      },
      {
        // Source: src/data/portfolio.json (prompt-lab.flow[2], prompt-lab.evidence[1])
        label: 'Automatic contract checks',
        title: 'Automatic contract checks',
        detail:
          'The output contract is checked automatically. In the 18 November 2026 run over ten cases, ' +
          'the reference passed 8/10 and v0.4 passed 10/10.',
        sources: ['src/data/portfolio.json#prompt-lab.flow[2]', 'src/data/portfolio.json#prompt-lab.evidence[1]'],
      },
      {
        // Source: src/data/portfolio.json (prompt-lab.evidence[1], prompt-lab.limits[0])
        label: 'Human verdict (partial)',
        title: 'Human verdict (partial)',
        detail:
          'Nine explicit human verdicts are kept, separate from the assistant’s recommendations. ' +
          'Human review coverage is partial; an automatic check does not replace it.',
        sources: ['src/data/portfolio.json#prompt-lab.evidence[1]', 'src/data/portfolio.json#prompt-lab.limits[0]'],
      },
    ],
  },

  // ── Polar (timeline) ─────────────────────────────────────────────────
  polar: {
    kind: 'timeline',
    title: 'Growing-history evaluation in the Polar study',
    desc:
      'Schematic timeline, not to scale. Days are in calendar order. For each evaluated day, the model is trained ' +
      'only on earlier days; the evaluated day is not part of its own training. Later folds use a longer history. ' +
      'N=1, retrospective.',
    badge: 'N=1, retrospective',
    // Schematic only: cell counts do not represent the real number of days.
    timeline: { cells: 12, firstEval: 8 },
    steps: [
      {
        // Source: scripts/polar/README.md:20; src/data/portfolio.json (polar.intro, polar.flow[1], polar.evidence[0])
        label: 'Days in calendar order',
        title: 'Data joined by date',
        detail:
          'Watch metrics and diary scores are joined by calendar date, with lags of 0 and 1 days. ' +
          'The published analysis has 61 paired dates.',
        sources: ['scripts/polar/README.md:20', 'src/data/portfolio.json#polar.intro', 'src/data/portfolio.json#polar.flow[1]', 'src/data/portfolio.json#polar.evidence[0]'],
      },
      {
        // Source: scripts/polar/README.md:23-24
        label: '30 observations before the first evaluation',
        title: 'History first',
        detail:
          'Evaluation starts after 30 observations and needs at least 3 examples of each class; ' +
          'failures and skipped cases are reported explicitly.',
        sources: ['scripts/polar/README.md:23-24'],
      },
      {
        // Source: scripts/polar/README.md:22,24-25
        label: 'Train on earlier days, evaluate one day',
        title: 'Evaluate one day',
        detail:
          'The evaluated day is not part of the training that evaluates it. ' +
          'The median and the scaling are fitted on the training days only.',
        sources: ['scripts/polar/README.md:22,24-25'],
      },
      {
        // Source: scripts/polar/README.md:23
        label: 'History grows',
        title: 'Growing history',
        detail: 'The training history grows over time: a later day is evaluated with a longer history of earlier days.',
        sources: ['scripts/polar/README.md:23'],
      },
      {
        // Source: scripts/polar/README.md:14-16,28-29; src/data/portfolio.json (polar.limits[0])
        label: 'N=1, retrospective',
        title: 'Aggregates and limits',
        detail:
          'Only aggregated results are published. This is a retrospective study of one person: ' +
          'no causality, generalisation, diagnosis or prospective validation.',
        sources: ['scripts/polar/README.md:14-16,28-29', 'src/data/portfolio.json#polar.limits[0]'],
      },
    ],
  },

  // ── Editorial checker ────────────────────────────────────────────────
  'editorial-checker': {
    kind: 'flow',
    title: 'How the editorial checker v1.0 reports',
    desc:
      'Five-step flow: Markdown files are checked with local rules, a JSON report is written to standard output, ' +
      'the exit code is 0, 1 or 2, and the report always says clinical_or_publication_approval: false, ' +
      'so a person makes the decision.',
    steps: [
      {
        // Source: scripts/editorial/README.md:12; src/data/portfolio.json (io3-alma.flow[0])
        label: 'Markdown files',
        title: 'Markdown files',
        detail: 'Input: Markdown files from the informes and lab collections.',
        sources: ['scripts/editorial/README.md:12', 'src/data/portfolio.json#io3-alma.flow[0]'],
      },
      {
        // Source: scripts/editorial/README.md:3,12; src/data/portfolio.json (io3-alma.intro)
        label: 'Local rules',
        title: 'Local rules',
        detail: 'Explicit rules using only the Python standard library. No models or services are loaded.',
        sources: ['scripts/editorial/README.md:3,12', 'src/data/portfolio.json#io3-alma.intro'],
      },
      {
        // Source: scripts/editorial/README.md:10; src/data/portfolio.json (io3-alma.flow[2])
        label: 'JSON report',
        title: 'JSON report',
        detail: 'Writes a JSON report with file, line and status to standard output. It does not modify files.',
        sources: ['scripts/editorial/README.md:10', 'src/data/portfolio.json#io3-alma.flow[2]'],
      },
      {
        // Source: scripts/editorial/README.md:14-20
        label: 'Exit code',
        title: 'Exit code 0 / 1 / 2',
        detail:
          '0: no findings under these rules (not a quality or publication approval). ' +
          '1: needs human review. 2: error; never a default approval.',
        branches: ['0 · no findings', '1 · human review', '2 · error'],
        sources: ['scripts/editorial/README.md:14-20'],
      },
      {
        // Source: scripts/editorial/README.md:22; src/data/portfolio.json (io3-alma.flow[3])
        label: 'Human decision',
        title: 'approval: false',
        detail: 'The report always returns clinical_or_publication_approval: false. A person reviews the findings.',
        tag: 'approval: false',
        sources: ['scripts/editorial/README.md:22', 'src/data/portfolio.json#io3-alma.flow[3]'],
      },
    ],
  },
}

export function getDiagram(slug) {
  const d = DIAGRAMS[slug]
  if (!d) throw new Error(`Unknown project diagram: ${slug}. Expected one of ${SLUGS.join(', ')}`)
  return d
}

// ── Text wrapping (approximate glyph width, Montserrat ~0.58em) ───────────
export function wrapText(text, maxChars) {
  const words = String(text).split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const w of words) {
    if (!line) line = w
    else if ((line + ' ' + w).length <= maxChars) line += ' ' + w
    else { lines.push(line); line = w }
  }
  if (line) lines.push(line)
  return lines
}

const CHAR_W = 0.58

// ── Flow layout ─────────────────────────────────────────────────────────
// orientation 'wide': nodes in a row; 'tall': nodes in a column.
export function layoutFlow(diagram, orientation = 'wide') {
  const wide = orientation === 'wide'
  const cfg = wide
    ? { nodeW: 156, gap: 34, pad: 14, font: 15, lineH: 19, bFont: 13, bLineH: 16 }
    : { nodeW: 300, gap: 30, pad: 14, font: 16, lineH: 20, bFont: 14, bLineH: 18 }
  const inner = cfg.nodeW - 2 * cfg.pad
  const badge = 22 // number badge row height

  const nodes = diagram.steps.map((step, i) => {
    const labelLines = wrapText(step.label, Math.floor(inner / (cfg.font * CHAR_W)))
    let h = cfg.pad + badge + 6 + labelLines.length * cfg.lineH
    const branches = (step.branches || []).map((b) => {
      const lines = wrapText(b, Math.floor((inner - 16) / (cfg.bFont * CHAR_W)))
      const bh = lines.length * cfg.bLineH + 12
      const out = { lines, h: bh, y: h + 8 }
      h += 8 + bh
      return out
    })
    let tag = null
    if (step.tag) {
      tag = { text: step.tag, y: h + 10, h: 26 }
      h += 10 + 26
    }
    h += cfg.pad
    return { step: i + 1, labelLines, branches, tag, h }
  })

  const margin = 8
  if (wide) {
    const nodeH = Math.max(...nodes.map((n) => n.h))
    nodes.forEach((n, i) => {
      n.x = margin + i * (cfg.nodeW + cfg.gap)
      n.y = margin
      n.w = cfg.nodeW
      n.h = nodeH
    })
    const width = margin * 2 + nodes.length * cfg.nodeW + (nodes.length - 1) * cfg.gap
    const height = margin * 2 + nodeH
    const arrows = nodes.slice(1).map((n, i) => {
      const prev = nodes[i]
      const y = prev.y + nodeH / 2
      return { step: n.step, x1: prev.x + prev.w + 4, y1: y, x2: n.x - 4, y2: y }
    })
    return { width, height, nodes, arrows, cfg }
  }

  let y = margin
  nodes.forEach((n) => {
    n.x = margin
    n.y = y
    n.w = cfg.nodeW
    y += n.h + cfg.gap
  })
  const width = margin * 2 + cfg.nodeW
  const height = y - cfg.gap + margin
  const arrows = nodes.slice(1).map((n, i) => {
    const prev = nodes[i]
    const x = prev.x + prev.w / 2
    return { step: n.step, x1: x, y1: prev.y + prev.h + 4, x2: x, y2: n.y - 4 }
  })
  return { width, height, nodes, arrows, cfg }
}

// ── Timeline layout (Polar) ─────────────────────────────────────────────
export function layoutTimeline(diagram, orientation = 'wide') {
  const wide = orientation === 'wide'
  const { cells, firstEval } = diagram.timeline
  const cfg = wide
    ? { width: 880, labelW: 150, cellGap: 6, font: 15, small: 13, rowH: 40 }
    : { width: 330, labelW: 82, cellGap: 3, font: 14, small: 13, rowH: 30 }
  const margin = 10
  const trackW = cfg.width - margin * 2 - cfg.labelW
  const cellW = (trackW - (cells - 1) * cfg.cellGap) / cells
  const x0 = margin + cfg.labelW
  const cellX = (i) => x0 + i * (cellW + cfg.cellGap)

  let y = margin
  const header = { y: y + cfg.font, badgeW: wide ? 190 : 168 }
  y += cfg.font + 22

  // Axis (step 1)
  const axis = { y: y + 10, x1: x0, x2: x0 + trackW, label: 'Days →', labelY: y + 14 }
  y += 30

  // Bracket over the initial history (step 2)
  const bracket = { x1: cellX(0), x2: cellX(firstEval - 1) + cellW, y: y + 4 }
  const bracketLines = wrapText(
    diagram.steps[1].label,
    Math.floor((bracket.x2 - bracket.x1) / (cfg.small * CHAR_W)),
  )
  bracket.textY = y + 22
  y += 22 + bracketLines.length * (cfg.small + 4) + 6

  const rows = []
  for (let r = 0; r < 2; r++) {
    const evalIdx = firstEval + r
    const row = {
      step: r === 0 ? 3 : 4,
      label: r === 0 ? 'Fold: day t' : 'Fold: day t+1',
      y,
      h: cfg.rowH,
      cells: Array.from({ length: cells }, (_, i) => ({
        x: cellX(i),
        w: cellW,
        state: i < evalIdx ? 'train' : i === evalIdx ? 'eval' : 'unused',
      })),
    }
    rows.push(row)
    y += cfg.rowH + 12
  }

  y += 6
  const legend = { y: y + cfg.small, items: [
    { state: 'train', text: 'Training days' },
    { state: 'eval', text: 'Evaluated day' },
    { state: 'unused', text: 'Not used in this fold' },
  ] }
  const legendCols = wide ? 3 : 1
  const legendItemW = wide ? 220 : cfg.width - margin * 2
  legend.items.forEach((it, i) => {
    it.x = margin + (i % legendCols) * legendItemW
    it.y = legend.y + Math.floor(i / legendCols) * (cfg.small + 10)
  })
  y = legend.items[legend.items.length - 1].y + 10
  const note = { y: y + cfg.small, text: 'Schematic, not to scale.' }
  y = note.y + margin

  return {
    width: cfg.width,
    height: Math.ceil(y),
    margin,
    cfg,
    header,
    axis,
    bracket: { ...bracket, lines: bracketLines },
    rows,
    legend,
    note,
  }
}
