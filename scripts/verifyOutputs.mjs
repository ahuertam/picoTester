// Script de verificación: parsea cada .md generado y reporta errores/estadísticas.
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseMarkdown } from '../src/utils/markdownParser.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'mdsIA', 'output')

const files = (await readdir(OUT_DIR)).filter((f) => f.endsWith('.md')).sort()

let totalQuestions = 0
let totalSingles = 0
let totalMultis = 0
let totalFatals = 0
let totalWarnings = 0
const issues = []

for (const f of files) {
  const path = join(OUT_DIR, f)
  const text = await readFile(path, 'utf8')
  const { questions, errors } = parseMarkdown(text)
  const fatals = errors.filter((e) => e.severity === 'fatal')
  const warnings = errors.filter((e) => e.severity === 'warning')
  const singles = questions.filter((q) => q.type === 'single').length
  const multis = questions.filter((q) => q.type === 'multiple').length

  totalQuestions += questions.length
  totalSingles += singles
  totalMultis += multis
  totalFatals += fatals.length
  totalWarnings += warnings.length

  console.log(
    `${f.padEnd(22)} ${String(questions.length).padStart(2)} preg  ` +
      `${singles} single + ${multis} multi  ` +
      `err fatales: ${fatals.length} · warnings: ${warnings.length}`
  )

  for (const e of fatals) issues.push({ file: f, ...e })
  for (const e of warnings) issues.push({ file: f, ...e })
}

console.log('-'.repeat(60))
console.log(
  `TOTAL  ${String(totalQuestions).padStart(2)} preguntas  ` +
    `${totalSingles} single + ${totalMultis} multi  ` +
    `err fatales: ${totalFatals} · warnings: ${totalWarnings}`
)

if (issues.length === 0) {
  console.log('\n✅ Todos los bancos pasan la validación del parser.')
} else {
  console.log('\n❌ Problemas encontrados:')
  for (const i of issues) {
    console.log(`  - [${i.file}] (${i.severity}) ${i.type}: ${i.message}`)
  }
  process.exit(1)
}
