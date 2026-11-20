import { readFileSync, readdirSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const DATA = join(ROOT, 'src', 'data', 'demos')
export const COMPONENTS = join(ROOT, 'src', 'components', 'demos')

export const readJson = (rel) => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'))
export const readText = (rel) => readFileSync(join(ROOT, rel), 'utf8')
export const sha256 = (x) => createHash('sha256').update(x).digest('hex')
export const sha256File = (rel) => sha256(readFileSync(join(ROOT, rel)))

export const FIXTURES = {
  editorial: 'src/data/demos/editorial/editorial-demo.json',
  promptLab: 'src/data/demos/prompt-lab/prompt-lab-demo.json',
  polarResults: 'src/data/demos/polar/polar-results.json',
  polarMethod: 'src/data/demos/polar/polar-method-synthetic.json',
}

export function listFiles(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...listFiles(p))
    else out.push(p)
  }
  return out
}

/** Every [key, value] pair in a JSON tree. */
export function* walk(value, path = '$') {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) yield* walk(value[i], `${path}[${i}]`)
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      yield [k, v, `${path}.${k}`]
      yield* walk(v, `${path}.${k}`)
    }
  }
}
