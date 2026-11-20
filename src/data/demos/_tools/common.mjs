// Shared helpers for the demo fixture generators. Node standard library only.
// These scripts run offline, never contact a network service and never call a model.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const TOOLS_DIR = dirname(fileURLToPath(import.meta.url))
// src/data/demos/_tools -> repository root
export const REPO_ROOT = resolve(TOOLS_DIR, '..', '..', '..', '..')
export const DEMOS_DATA = resolve(TOOLS_DIR, '..')

export function sha256(bufOrString) {
  return createHash('sha256').update(bufOrString).digest('hex')
}

export function sha256File(path) {
  return sha256(readFileSync(path))
}

/** Repository-relative POSIX path; never an absolute local path. */
export function repoRel(absPath) {
  return relative(REPO_ROOT, absPath).split(sep).join('/')
}

export function writeJson(absPath, data) {
  writeFileSync(absPath, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`wrote ${repoRel(absPath)}`)
}

/** Fails loudly if a generated object would leak a local path or a private field. */
export function assertPublishable(obj) {
  const text = JSON.stringify(obj)
  if (text.includes('/Users/')) throw new Error('Refusing to write a local /Users/ path')
  const walk = (v) => {
    if (v && typeof v === 'object') {
      for (const [k, child] of Object.entries(v)) {
        if (/^private/i.test(k)) throw new Error(`Refusing to write private field: ${k}`)
        walk(child)
      }
    }
  }
  walk(obj)
}
