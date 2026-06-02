import { shuffle } from './shuffle.js'

/**
 * Compara la selección del usuario con las opciones correctas de una pregunta.
 * Para multi-respuesta, todas las correctas deben estar marcadas y solo ellas.
 *
 * @param {{ options: Array<{ id: string, isCorrect: boolean }> }} question
 * @param {string[]} selectedIds
 * @returns {boolean}
 */
export function isAnswerCorrect(question, selectedIds) {
  const correctIds = question.options.filter((o) => o.isCorrect).map((o) => o.id)
  if (correctIds.length !== selectedIds.length) return false
  const set = new Set(selectedIds)
  return correctIds.every((id) => set.has(id))
}

/**
 * Genera la sesión de examen. Selecciona N preguntas y aplica orden aleatorio
 * (a preguntas y opciones) si `randomOrder` está activo.
 *
 * @param {Question[]} questions - banco completo
 * @param {Config} config
 * @param {Question[] | null} [source] - si se pasa, se usa como pool (modo repaso)
 * @returns {{ questions: Question[], truncated: boolean }}
 */
export function generateExamSession(questions, config, source = null) {
  const pool = source ?? questions

  let selected
  let truncated = false
  if (pool.length <= config.questionCount) {
    selected = pool.slice()
  } else {
    selected = shuffle(pool).slice(0, config.questionCount)
    truncated = true
  }

  const ordered = applyRandomOrder(selected, config.randomOrder)
  return { questions: ordered, truncated }
}

function applyRandomOrder(questions, random) {
  if (!random) return questions
  return questions.map((q) => ({
    ...q,
    options: shuffle(q.options),
  }))
}

/**
 * Calcula el resultado completo de un examen a partir de las preguntas y respuestas.
 *
 * @param {Question[]} questions
 * @param {{ questionId: string, selected: string[] }[]} answers
 * @param {string} startedAt - ISO
 * @param {string} finishedAt - ISO
 * @param {'normal' | 'retry'} [mode]
 */
export function computeResult(questions, answers, startedAt, finishedAt, mode = 'normal') {
  const total = questions.length
  const answerMap = new Map(answers.map((a) => [a.questionId, a]))

  let correct = 0
  let incorrect = 0
  let blank = 0
  const detailed = []

  for (const q of questions) {
    const a = answerMap.get(q.id)
    if (!a || a.selected.length === 0) {
      blank++
      detailed.push({ questionId: q.id, selected: [], isCorrect: false, blank: true })
    } else {
      const ok = isAnswerCorrect(q, a.selected)
      if (ok) correct++
      else incorrect++
      detailed.push({ questionId: q.id, selected: a.selected, isCorrect: ok, blank: false })
    }
  }

  const score = total === 0 ? 0 : Math.round((correct / total) * 100) / 10
  const percentage = total === 0 ? 0 : Math.round((correct / total) * 100)
  const durationSeconds = Math.max(
    0,
    Math.round((new Date(finishedAt) - new Date(startedAt)) / 1000)
  )

  return {
    total,
    correct,
    incorrect,
    blank,
    score,
    percentage,
    durationSeconds,
    answers: detailed,
    startedAt,
    finishedAt,
    mode,
  }
}

/**
 * Actualiza la cola de fallos a partir de un resultado.
 *
 * Reglas:
 * - Aciertos: se eliminan de la cola.
 * - Fallos: incrementan `failedCount` y actualizan `lastFailedAt`.
 * - Entradas no tocadas por este examen: se mantienen.
 *
 * @param {RetryQueueEntry[]} queue
 * @param {Result} result
 * @returns {RetryQueueEntry[]}
 */
export function updateRetryQueue(queue, result) {
  const now = new Date().toISOString()
  const statusByQ = new Map() // questionId -> isCorrect
  for (const a of result.answers) {
    statusByQ.set(a.questionId, a.isCorrect)
  }

  const newQueue = []

  for (const entry of queue) {
    const status = statusByQ.get(entry.questionId)
    if (status === true) {
      // Acierto: eliminar
      continue
    }
    if (status === false) {
      newQueue.push({
        questionId: entry.questionId,
        failedCount: entry.failedCount + 1,
        lastFailedAt: now,
      })
    } else {
      // No testeada en este examen: mantener
      newQueue.push(entry)
    }
  }

  // Añadir nuevos fallos que no estaban en la cola
  for (const a of result.answers) {
    if (a.isCorrect) continue
    if (queue.some((e) => e.questionId === a.questionId)) continue
    newQueue.push({
      questionId: a.questionId,
      failedCount: 1,
      lastFailedAt: now,
    })
  }

  return newQueue
}

/**
 * Resuelve las preguntas completas a partir de sus IDs en la cola.
 *
 * @param {RetryQueueEntry[]} queue
 * @param {Question[]} questions
 * @returns {Question[]}
 */
export function getRetryQueueQuestions(queue, questions) {
  const byId = new Map(questions.map((q) => [q.id, q]))
  return queue.map((entry) => byId.get(entry.questionId)).filter(Boolean)
}
