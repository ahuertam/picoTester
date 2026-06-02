// Simula lo que hace FileDropzone al subir varios archivos:
// 1. Lee 3 archivos .md de mdsIA/output/
// 2. Parsea cada uno con parseMarkdown
// 3. Combina las preguntas y re-indexa (q-0, q-1, ...)
// 4. Verifica que no hay colisiones de IDs y que no hay errores fatales

import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseMarkdown } from '../src/utils/markdownParser.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIR = join(__dirname, '..', 'mdsIA', 'output')

const files = (await readdir(DIR))
  .filter((f) => f.endsWith('.md'))
  .sort()
  .slice(0, 3) // Simulamos 3 archivos

console.log(`Simulando subida múltiple con: ${files.join(', ')}\n`)

const all = []
const allErrors = []
for (const f of files) {
  const text = await readFile(join(DIR, f), 'utf8')
  const { questions, errors } = parseMarkdown(text)
  console.log(`  ${f}: ${questions.length} preguntas, ${errors.length} errores`)
  for (const q of questions) all.push(q)
  for (const e of errors) allErrors.push({ ...e, fileName: f })
}

// Re-indexar (esto es lo que hace FileDropzone)
all.forEach((q, i) => {
  q.id = `q-${i}`
  q.options.forEach((o, j) => {
    o.id = `q-${i}-o-${j}`
  })
})

// Verificar unicidad de IDs
const ids = new Set()
let collisions = 0
for (const q of all) {
  if (ids.has(q.id)) collisions++
  ids.add(q.id)
  for (const o of q.options) {
    if (ids.has(o.id)) collisions++
    ids.add(o.id)
  }
}

const fatals = allErrors.filter((e) => e.severity === 'fatal')
const warnings = allErrors.filter((e) => e.severity === 'warning')

console.log('\n--- Resultado tras concatenar y re-indexar ---')
console.log(`Total preguntas: ${all.length}`)
console.log(`IDs únicos:     ${ids.size} (sin colisiones)`)
console.log(`IDs colisión:   ${collisions}`)
console.log(`Errores fatales: ${fatals.length}`)
console.log(`Warnings:       ${warnings.length}`)
console.log(`Primeras 3 preguntas:`)
for (const q of all.slice(0, 3)) {
  console.log(`  ${q.id}: ${q.text.slice(0, 60)}...`)
}
console.log(`Última pregunta:`)
const last = all[all.length - 1]
console.log(`  ${last.id}: ${last.text.slice(0, 60)}...`)

if (collisions === 0 && fatals.length === 0) {
  console.log('\n✅ La concatenación multi-archivo funciona correctamente.')
} else {
  console.log('\n❌ Problemas detectados.')
  process.exit(1)
}
