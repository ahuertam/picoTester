import { describe, it, expect } from 'vitest'
import {
  isAnswerCorrect,
  generateExamSession,
  computeResult,
  updateRetryQueue,
  getRetryQueueQuestions,
} from '../examLogic.js'

function mkSingle(id, correctIdx = 1) {
  return {
    id,
    text: `Single ${id}`,
    type: 'single',
    options: [
      { id: `${id}-o-0`, text: 'A', isCorrect: correctIdx === 0 },
      { id: `${id}-o-1`, text: 'B', isCorrect: correctIdx === 1 },
    ],
  }
}

function mkMulti(id) {
  return {
    id,
    text: `Multi ${id}`,
    type: 'multiple',
    options: [
      { id: `${id}-o-0`, text: 'A', isCorrect: true },
      { id: `${id}-o-1`, text: 'B', isCorrect: false },
      { id: `${id}-o-2`, text: 'C', isCorrect: true },
    ],
  }
}

const singleQ = mkSingle('q-0')
const multiQ = mkMulti('q-1')

const config = {
  timePerExam: 0,
  questionCount: 10,
  randomOrder: false,
  showResultImmediately: true,
  navigationMode: 'free',
}

describe('isAnswerCorrect', () => {
  it('acierto en single', () => {
    expect(isAnswerCorrect(singleQ, ['q-0-o-1'])).toBe(true)
  })

  it('fallo en single', () => {
    expect(isAnswerCorrect(singleQ, ['q-0-o-0'])).toBe(false)
  })

  it('acierto en multi con todas las correctas', () => {
    expect(isAnswerCorrect(multiQ, ['q-1-o-0', 'q-1-o-2'])).toBe(true)
  })

  it('fallo en multi si falta una correcta', () => {
    expect(isAnswerCorrect(multiQ, ['q-1-o-0'])).toBe(false)
  })

  it('fallo en multi si sobra una incorrecta', () => {
    expect(isAnswerCorrect(multiQ, ['q-1-o-0', 'q-1-o-1', 'q-1-o-2'])).toBe(false)
  })

  it('respuesta vacía es incorrecta', () => {
    expect(isAnswerCorrect(singleQ, [])).toBe(false)
  })
})

describe('generateExamSession', () => {
  it('devuelve todas las preguntas si el pool es menor que questionCount', () => {
    const { questions, truncated } = generateExamSession([singleQ, multiQ], config)
    expect(questions).toHaveLength(2)
    expect(truncated).toBe(false)
  })

  it('selecciona N preguntas si el pool es mayor', () => {
    const big = Array.from({ length: 20 }, (_, i) => ({
      ...singleQ,
      id: `q-${i}`,
    }))
    const { questions, truncated } = generateExamSession(big, {
      ...config,
      questionCount: 5,
    })
    expect(questions).toHaveLength(5)
    expect(truncated).toBe(true)
  })

  it('usa source como pool cuando se pasa (modo repaso)', () => {
    const retry = [singleQ]
    const { questions, truncated } = generateExamSession([singleQ, multiQ], config, retry)
    expect(questions).toEqual([singleQ])
    expect(truncated).toBe(false)
  })
})

describe('computeResult', () => {
  it('calcula correct/incorrect/blank', () => {
    const questions = [mkSingle('q-0'), mkMulti('q-1'), mkSingle('q-2')]
    const answers = [
      { questionId: 'q-0', selected: ['q-0-o-1'] }, // acierto
      { questionId: 'q-1', selected: ['q-1-o-0', 'q-1-o-2'] }, // acierto
      { questionId: 'q-2', selected: [] }, // en blanco
    ]
    const result = computeResult(
      questions,
      answers,
      '2026-06-02T10:00:00.000Z',
      '2026-06-02T10:05:00.000Z'
    )
    expect(result.total).toBe(3)
    expect(result.correct).toBe(2)
    expect(result.blank).toBe(1)
    expect(result.incorrect).toBe(0)
  })

  it('calcula nota 0-10 con 1 decimal', () => {
    const questions = [mkSingle('q-0'), mkMulti('q-1'), mkSingle('q-2'), mkSingle('q-3')]
    const answers = [
      { questionId: 'q-0', selected: ['q-0-o-1'] },
      { questionId: 'q-1', selected: ['q-1-o-0', 'q-1-o-2'] },
      { questionId: 'q-2', selected: ['q-2-o-0'] }, // fallo
      { questionId: 'q-3', selected: [] },
    ]
    const result = computeResult(
      questions,
      answers,
      '2026-06-02T10:00:00.000Z',
      '2026-06-02T10:00:00.000Z'
    )
    expect(result.correct).toBe(2)
    expect(result.score).toBe(5) // 2/4 * 10 = 5.0
    expect(result.percentage).toBe(50)
  })

  it('maneja banco vacío', () => {
    const result = computeResult([], [], '2026-06-02T10:00:00.000Z', '2026-06-02T10:00:00.000Z')
    expect(result.total).toBe(0)
    expect(result.score).toBe(0)
    expect(result.percentage).toBe(0)
  })

  it('calcula duración en segundos', () => {
    const result = computeResult(
      [singleQ],
      [{ questionId: 'q-0', selected: ['q-0-o-1'] }],
      '2026-06-02T10:00:00.000Z',
      '2026-06-02T10:00:42.000Z'
    )
    expect(result.durationSeconds).toBe(42)
  })
})

describe('updateRetryQueue', () => {
  it('elimina aciertos de la cola', () => {
    const queue = [{ questionId: 'q-0', failedCount: 1, lastFailedAt: 'x' }]
    const result = {
      answers: [{ questionId: 'q-0', isCorrect: true, blank: false }],
    }
    expect(updateRetryQueue(queue, result)).toEqual([])
  })

  it('incrementa contador de fallos', () => {
    const queue = [{ questionId: 'q-0', failedCount: 2, lastFailedAt: 'old' }]
    const result = {
      answers: [{ questionId: 'q-0', isCorrect: false, blank: false }],
    }
    const next = updateRetryQueue(queue, result)
    expect(next).toHaveLength(1)
    expect(next[0].questionId).toBe('q-0')
    expect(next[0].failedCount).toBe(3)
    expect(next[0].lastFailedAt).not.toBe('old')
  })

  it('añade nuevos fallos no presentes en la cola', () => {
    const queue = []
    const result = {
      answers: [{ questionId: 'q-0', isCorrect: false, blank: false }],
    }
    const next = updateRetryQueue(queue, result)
    expect(next).toHaveLength(1)
    expect(next[0].failedCount).toBe(1)
  })

  it('mantiene entradas no testeadas en este examen', () => {
    const queue = [
      { questionId: 'q-0', failedCount: 1, lastFailedAt: 'x' },
      { questionId: 'q-1', failedCount: 2, lastFailedAt: 'y' },
    ]
    const result = {
      answers: [{ questionId: 'q-0', isCorrect: true, blank: false }], // solo q-0
    }
    const next = updateRetryQueue(queue, result)
    expect(next).toHaveLength(1)
    expect(next[0].questionId).toBe('q-1')
  })
})

describe('getRetryQueueQuestions', () => {
  it('resuelve IDs a preguntas completas', () => {
    const queue = [
      { questionId: 'q-0', failedCount: 1, lastFailedAt: 'x' },
      { questionId: 'q-99', failedCount: 1, lastFailedAt: 'x' }, // no existe
    ]
    const resolved = getRetryQueueQuestions(queue, [singleQ, multiQ])
    expect(resolved).toEqual([singleQ])
  })
})
