// Parser de markdown para el formato de preguntas de picoTester.
//
// Formato esperado:
//   ## Enunciado de la pregunta
//   - [ ] Opción incorrecta
//   - [x] Opción correcta
//   - [X] Opción correcta (mayúsculas equivalentes)
//
// Cada bloque `##` es una pregunta. Las opciones son líneas que empiezan por
// `- [` seguido de ` ` o `x` (case-insensitive) y luego el texto.

const QUESTION_RE = /^##\s*(.*?)\s*$/
const OPTION_RE = /^-\s+\[([ xX])\]\s+(.+?)\s*$/
const OPTION_LIKE_RE = /^\s*-\s+\[/

/**
 * Parsea texto markdown y devuelve preguntas validadas + lista de errores.
 *
 * @param {string} text
 * @returns {{ questions: Question[], errors: ParseError[] }}
 *
 * Question: { id, text, options: [{id, text, isCorrect}], type: 'single'|'multiple' }
 * ParseError: { type, severity: 'fatal'|'warning', message, line? }
 */
export function parseMarkdown(text) {
  const errors = []

  if (!text || !text.trim()) {
    return {
      questions: [],
      errors: [{ type: 'empty_file', severity: 'fatal', message: 'El archivo está vacío.' }],
    }
  }

  const lines = text.split(/\r?\n/)
  const raw = [] // bloques crudos { text, options: [{text, isCorrect}] }
  let current = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNo = i + 1

    const qMatch = line.match(QUESTION_RE)
    if (qMatch) {
      if (current) raw.push(current)

      const text = qMatch[1]
      if (!text) {
        errors.push({
          type: 'empty_question',
          severity: 'fatal',
          line: lineNo,
          message: `Pregunta sin enunciado en línea ${lineNo}.`,
        })
        current = null
      } else {
        current = { text, options: [] }
      }
      continue
    }

    const oMatch = line.match(OPTION_RE)
    if (oMatch) {
      if (!current) {
        errors.push({
          type: 'orphan_option',
          severity: 'fatal',
          line: lineNo,
          message: `Opción sin pregunta en línea ${lineNo}.`,
        })
        continue
      }
      current.options.push({
        text: oMatch[2],
        isCorrect: oMatch[1].toLowerCase() === 'x',
      })
      continue
    }

    // Línea que parece una opción pero no encaja con el formato
    if (current && OPTION_LIKE_RE.test(line)) {
      errors.push({
        type: 'bad_option_format',
        severity: 'fatal',
        line: lineNo,
        message: `Línea ${lineNo} parece una opción pero el formato no es válido (usa "- [ ]" o "- [x]").`,
      })
    }
    // Otro texto (explicaciones, separadores, etc.) se ignora silenciosamente.
  }

  if (current) raw.push(current)

  // Asignar IDs estables y validar cada bloque.
  const questions = []
  raw.forEach((block, idx) => {
    const q = buildQuestion(block, idx)
    const validationErrors = validateQuestion(q)
    if (validationErrors.length > 0) {
      errors.push(...validationErrors)
      // Solo conservamos la pregunta si no hay errores fatales.
      const hasFatal = validationErrors.some((e) => e.severity === 'fatal')
      if (!hasFatal) questions.push(q)
    } else {
      questions.push(q)
    }
  })

  return { questions, errors }
}

function buildQuestion(block, idx) {
  const correctCount = block.options.filter((o) => o.isCorrect).length
  return {
    id: `q-${idx}`,
    text: block.text,
    options: block.options.map((o, j) => ({
      id: `q-${idx}-o-${j}`,
      text: o.text,
      isCorrect: o.isCorrect,
    })),
    type: correctCount > 1 ? 'multiple' : 'single',
  }
}

function validateQuestion(q) {
  const errors = []

  if (q.options.length === 0) {
    errors.push({
      type: 'no_options',
      severity: 'fatal',
      message: `Pregunta "${q.text}" no tiene opciones.`,
    })
    return errors
  }

  if (q.options.length === 1) {
    errors.push({
      type: 'one_option',
      severity: 'fatal',
      message: `Pregunta "${q.text}" tiene solo una opción.`,
    })
    return errors
  }

  const correctCount = q.options.filter((o) => o.isCorrect).length

  if (correctCount === 0) {
    errors.push({
      type: 'no_correct',
      severity: 'fatal',
      message: `Pregunta "${q.text}" no tiene opciones correctas.`,
    })
    return errors
  }

  if (correctCount === q.options.length) {
    errors.push({
      type: 'all_correct',
      severity: 'warning',
      message: `Pregunta "${q.text}" tiene todas las opciones marcadas como correctas.`,
    })
  }

  return errors
}
