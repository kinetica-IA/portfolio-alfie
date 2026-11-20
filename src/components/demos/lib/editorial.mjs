// Pure helpers for the editorial demo.

/** Same line split as Python's str.splitlines() for LF/CRLF text (no trailing empty line). */
export function splitLines(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  if (lines.length && lines[lines.length - 1] === '') lines.pop()
  return lines
}

/** Anchor id of a source line. One EditorialDemo per page, so the sample id keeps it unique. */
export function lineId(sampleId, line) {
  return `ed-${sampleId}-L${line}`
}

/** Sample id and line number from a hash such as "#ed-error-L15", or null. */
export function parseLineHash(hash) {
  const m = /^#?ed-([a-z0-9-]+)-L(\d+)$/.exec(hash || '')
  return m ? { sampleId: m[1], line: Number(m[2]) } : null
}

/** Line numbers that carry at least one finding, for highlighting. */
export function flaggedLines(result) {
  const set = new Set()
  for (const file of result.files ?? []) for (const f of file.findings ?? []) set.add(f.line)
  return set
}
