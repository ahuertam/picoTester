// Convierte imágenes (jpg/jpeg/png/webp) a texto crudo mediante OCR (tesseract.js).
// Pensado como paso previo al prompt IAconvertMD.md — NO genera bancos de preguntas.
//
// Por defecto escribe un .txt por imagen en mdsIA/raw/. Con --out archivo.txt
// concatena todas las imágenes en un único archivo con headers separadores.
//
// Uso:
//   node scripts/ocrImages.mjs foto1.jpg foto2.png
//   node scripts/ocrImages.mjs -o combinado.txt fotos/*.jpg
//   node scripts/ocrImages.mjs -l eng -o raw/ solo-ingles.png
//
// Exit codes:
//   0 = todo OK
//   1 = al menos una imagen falló de forma irrecuperable
//   2 = error de uso (sin args, flag desconocido, --out inválido)
//
// Dependencias: tesseract.js (devDependency). No requiere binarios del sistema.
//
// Extensiones futuras (no implementadas): soporte PDF, pre-procesado con sharp,
// modo --json con confianza por palabra, integración directa con LLM, cache por hash.

import { mkdir, writeFile } from 'node:fs/promises'
import { statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, basename, extname, resolve, sep } from 'node:path'
import { createWorker } from 'tesseract.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_OUT_DIR = join(__dirname, '..', 'mdsIA', 'raw')

const VALID_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

// --- CLI parsing ---

function printHelp() {
  console.log(`Uso: node scripts/ocrImages.mjs [opciones] <imagen> [imagen...]

Convierte imágenes a texto crudo mediante OCR (tesseract.js).
Salida: un .txt por imagen en mdsIA/raw/ por defecto, o un único archivo
        concatenado si --out apunta a un archivo (no directorio).

Opciones:
  -o, --out <path>   Directorio o archivo de salida.
                     Si se omite: mdsIA/raw/ (un .txt por imagen).
  -l, --lang <codes> Códigos de idioma tesseract separados por '+'.
                     Default: spa+eng
  -h, --help         Muestra esta ayuda.

Ejemplos:
  node scripts/ocrImages.mjs fotos/p1.jpg fotos/p2.png
  node scripts/ocrImages.mjs -o todo.txt fotos/*.jpg
  node scripts/ocrImages.mjs -l eng -o raw/ solo-ingles.png`)
}

function parseArgs(argv) {
  const positional = []
  const flags = { out: null, lang: 'spa+eng', help: false }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '-h' || a === '--help') {
      flags.help = true
    } else if (a === '-o' || a === '--out') {
      flags.out = argv[++i]
      if (flags.out === undefined) throw new Error(`La opción ${a} requiere un valor`)
    } else if (a === '-l' || a === '--lang') {
      flags.lang = argv[++i]
      if (flags.lang === undefined) throw new Error(`La opción ${a} requiere un valor`)
    } else if (a.startsWith('--out=')) {
      flags.out = a.slice('--out='.length)
    } else if (a.startsWith('--lang=')) {
      flags.lang = a.slice('--lang='.length)
    } else if (a.startsWith('-')) {
      throw new Error(`Flag desconocido: ${a} (usa --help)`)
    } else {
      positional.push(a)
    }
  }

  return { positional, flags }
}

// --- Output target resolution ---

function resolveOutTarget(flagOut) {
  if (!flagOut) {
    return { kind: 'dir', path: DEFAULT_OUT_DIR }
  }
  const abs = resolve(flagOut)
  try {
    const s = statSync(abs)
    if (s.isDirectory()) return { kind: 'dir', path: abs }
  } catch {
    // not found
  }
  // No existe: si termina en separador, tratar como directorio.
  if (flagOut.endsWith('/') || flagOut.endsWith(sep)) {
    return { kind: 'dir', path: abs }
  }
  return { kind: 'file', path: abs }
}

// --- Image validation ---

function isReadableImage(path) {
  if (!VALID_EXTS.has(extname(path).toLowerCase())) {
    return { ok: false, reason: `extensión no soportada (${extname(path)})` }
  }
  try {
    const s = statSync(path)
    if (!s.isFile()) return { ok: false, reason: 'no es un archivo regular' }
    if (s.size === 0) return { ok: false, reason: 'archivo vacío' }
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: e.code === 'ENOENT' ? 'no existe' : `error de lectura (${e.code})` }
  }
}

// --- OCR ---

function normalizeText(raw) {
  return (raw || '')
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function runOcr(worker, imagePath) {
  const { data } = await worker.recognize(imagePath)
  return { text: normalizeText(data.text), confidence: data.confidence }
}

// --- Output helpers ---

function outputNameFor(imagePath, outDir) {
  return join(outDir, basename(imagePath, extname(imagePath)) + '.txt')
}

function blockForSingleFile(imagePath, lang, text) {
  const ts = new Date().toISOString()
  const sep = '='.repeat(64)
  return `${sep}
| ${basename(imagePath)}
| ${lang}
| ${ts}
${sep}

${text}

`
}

// --- Main ---

async function main() {
  let args
  try {
    args = parseArgs(process.argv.slice(2))
  } catch (e) {
    console.error(`Error: ${e.message}`)
    process.exit(2)
  }

  if (args.flags.help) {
    printHelp()
    return 0
  }

  if (args.positional.length === 0) {
    console.error('Error: no se proporcionaron imágenes.')
    console.error('Uso: node scripts/ocrImages.mjs [opciones] <imagen> [imagen...]')
    console.error('(usa --help para más información)')
    process.exit(2)
  }

  // Validar --lang: no vacío, sin '+' consecutivos
  const langs = args.flags.lang.split('+').map((s) => s.trim()).filter(Boolean)
  if (langs.length === 0) {
    console.error('Error: --lang no puede estar vacío.')
    process.exit(2)
  }

  const outTarget = resolveOutTarget(args.flags.out)

  if (outTarget.kind === 'dir') {
    await mkdir(outTarget.path, { recursive: true })
  } else {
    // archivo único: asegurar que el directorio padre existe
    await mkdir(dirname(outTarget.path), { recursive: true })
  }

  const langDisplay = langs.join('+')
  const verbose = process.env.VERBOSE === '1'

  const worker = await createWorker(langs, 1, {
    logger: (m) => {
      if (verbose && m.status === 'recognizing text') {
        process.stdout.write(`\r  progress: ${(m.progress * 100).toFixed(0)}%   `)
      }
    },
  })

  const results = []
  let hadHardError = false

  try {
    for (let i = 0; i < args.positional.length; i++) {
      const imagePath = args.positional[i]
      const tag = `[${i + 1}/${args.positional.length}]`

      const check = isReadableImage(imagePath)
      if (!check.ok) {
        console.error(`${tag} ⚠️  ${imagePath}: ${check.reason}`)
        const displayName =
          outTarget.kind === 'dir'
            ? basename(imagePath, extname(imagePath)) + '.txt'
            : basename(outTarget.path)
        results.push({ name: displayName, status: 'error', message: check.reason })
        hadHardError = true
        continue
      }

      console.log(`${tag} Procesando ${imagePath} ...`)
      try {
        const { text, confidence } = await runOcr(worker, imagePath)
        if (verbose) process.stdout.write('\n')

        if (text === '') {
          console.error(`${tag} ⚠️  OCR no devolvió texto para ${imagePath}`)
          const emptyMarker = '[OCR no devolvió texto]'
          if (outTarget.kind === 'dir') {
            await writeFile(outputNameFor(imagePath, outTarget.path), emptyMarker + '\n', 'utf8')
          }
          results.push({
            name: basename(imagePath, extname(imagePath)) + '.txt',
            status: 'empty',
            message: 'OCR vacío',
          })
          hadHardError = true
          continue
        }

        if (outTarget.kind === 'dir') {
          await writeFile(outputNameFor(imagePath, outTarget.path), text + '\n', 'utf8')
        } else {
          const block = blockForSingleFile(imagePath, langDisplay, text)
          await writeFile(outTarget.path, block, { flag: 'a', encoding: 'utf8' })
        }

        results.push({
          name:
            outTarget.kind === 'dir'
              ? basename(imagePath, extname(imagePath)) + '.txt'
              : basename(outTarget.path),
          status: 'ok',
          chars: text.length,
          confidence: Math.round(confidence),
        })
      } catch (e) {
        if (verbose) process.stdout.write('\n')
        console.error(`${tag} ❌ Error procesando ${imagePath}: ${e.message}`)
        const displayName =
          outTarget.kind === 'dir'
            ? basename(imagePath, extname(imagePath)) + '.txt'
            : basename(outTarget.path)
        results.push({ name: displayName, status: 'error', message: e.message })
        hadHardError = true
      }
    }
  } finally {
    await worker.terminate()
  }

  // Tabla resumen
  console.log('-'.repeat(60))
  console.log('archivo'.padEnd(30) + 'caracteres'.padStart(10) + '  estado')
  let okCount = 0
  let warnCount = 0
  let errCount = 0
  for (const r of results) {
    if (r.status === 'ok') okCount++
    else if (r.status === 'empty') warnCount++
    else errCount++
    const charsCol = r.status === 'ok' ? String(r.chars).padStart(10) : '-'.padStart(10)
    let statusCol
    if (r.status === 'ok') statusCol = `✅ (${r.confidence}%)`
    else if (r.status === 'empty') statusCol = `⚠️  ${r.message}`
    else statusCol = `❌ ${r.message}`
    console.log(r.name.padEnd(30) + charsCol + '  ' + statusCol)
  }
  console.log('-'.repeat(60))
  const total = args.positional.length
  console.log(
    `${total} imágenes, ${okCount} OK, ${warnCount} con advertencias, ${errCount} errores`,
  )

  if (outTarget.kind === 'file') {
    console.log(`Salida concatenada: ${outTarget.path}`)
  } else {
    console.log(`Salida en: ${outTarget.path}`)
  }

  process.exit(hadHardError ? 1 : 0)
}

main().catch((e) => {
  console.error('Error inesperado:', e)
  process.exit(1)
})
