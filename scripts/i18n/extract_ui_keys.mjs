// Lists Chinese strings in src/ (comments stripped) into scripts/i18n/ui-keys.txt.
// Run: node scripts/i18n/extract_ui_keys.mjs
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
// esbuild ships with tsx (a dev dependency); resolve it from there.
const { transformSync } = createRequire(require.resolve('tsx/package.json'))('esbuild')
const root = path.resolve(import.meta.dirname, '..', '..')
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
const cjk = /[\u3040-\u30ff\u4e00-\u9fff]/
const str = /"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`|'((?:[^'\\]|\\.)*)'/g
const fieldAccess = /[.?]\s*[\u4e00-\u9fff]|[\u4e00-\u9fff]+\s*:/
const out = []
const seen = new Set()
for (const file of walk(path.join(root, 'src')).filter((f) => /\.tsx?$/.test(f) && !f.endsWith('routeTree.gen.ts') && !f.includes(`${path.sep}i18n${path.sep}`))) {
  const code = transformSync(fs.readFileSync(file, 'utf8'), { loader: file.endsWith('x') ? 'tsx' : 'ts', jsx: 'preserve', legalComments: 'none', charset: 'utf8' }).code
  const keys = []
  for (const line of code.split('\n')) {
    if (!cjk.test(line)) continue
    for (const m of line.matchAll(str)) keys.push(m[1] ?? m[2] ?? m[3] ?? '')
    for (const seg of line.replace(str, '').split(/[<>{}]/)) if (cjk.test(seg) && !fieldAccess.test(seg)) keys.push(seg)
  }
  const rel = path.relative(root, file)
  let header = false
  for (const raw of keys) {
    const key = raw.replace(/\$\{(?:[^{}]|\{[^{}]*\})*\}/g, '{}').trim()
    if (!cjk.test(key) || seen.has(key)) continue
    seen.add(key)
    if (!header) {
      out.push(`### ${rel}`)
      header = true
    }
    out.push(key.replace(/\n/g, '\\n'))
  }
}
fs.writeFileSync(path.join(import.meta.dirname, 'ui-keys.txt'), out.join('\n') + '\n')
console.log(`${seen.size} keys -> scripts/i18n/ui-keys.txt`)
