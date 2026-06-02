import { useState, useCallback, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import {
  generateExamSession,
  computeResult,
  updateRetryQueue,
  getRetryQueueQuestions,
} from '../utils/examLogic.js'
import { STORAGE_KEYS, DEFAULT_CONFIG } from '../constants.js'
import { ExamContext } from '../hooks/useExam.js'

export function ExamProvider({ children }) {
  // Persistido
  const [config, setConfig] = useLocalStorage(STORAGE_KEYS.config, DEFAULT_CONFIG)
  const [retryQueue, setRetryQueue] = useLocalStorage(STORAGE_KEYS.retryQueue, [])

  // Persistido: banco, exclusions y última carga
  const [questions, setQuestions] = useLocalStorage(STORAGE_KEYS.questions, [])
  const [excluded, setExcluded] = useLocalStorage(STORAGE_KEYS.excluded, [])
  const [lastUploadAt, setLastUploadAt] = useLocalStorage(STORAGE_KEYS.lastUploadAt, null)

  // En memoria (no se persiste)
  const [examSession, setExamSession] = useState(null)
  const [result, setResult] = useState(null)

  // Set derivado para lookups O(1) sobre `excluded`
  const excludedSet = useMemo(() => new Set(excluded), [excluded])

  const loadQuestions = useCallback(
    (parsed) => {
      setQuestions(parsed)
      setExcluded([])
      setLastUploadAt(new Date().toISOString())
      // Limpia entradas de la cola cuyos IDs ya no existen en el nuevo banco.
      setRetryQueue((q) => q.filter((entry) => parsed.some((p) => p.id === entry.questionId)))
      setExamSession(null)
      setResult(null)
    },
    [setQuestions, setExcluded, setLastUploadAt, setRetryQueue]
  )

  const toggleExclude = useCallback(
    (questionId) => {
      setExcluded((prev) =>
        prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
      )
    },
    [setExcluded]
  )

  const resetExcluded = useCallback(() => {
    setExcluded([])
  }, [setExcluded])

  const deleteQuestion = useCallback(
    (questionId) => {
      setQuestions((prev) => prev.filter((q) => q.id !== questionId))
      setExcluded((prev) => prev.filter((id) => id !== questionId))
    },
    [setQuestions, setExcluded]
  )

  const clearBank = useCallback(() => {
    setQuestions([])
    setExcluded([])
    setLastUploadAt(null)
    setRetryQueue([]) // todas las entradas quedan huérfanas
    setExamSession(null)
    setResult(null)
  }, [setQuestions, setExcluded, setLastUploadAt, setRetryQueue])

  const startExam = useCallback(
    (mode = 'normal', source = null) => {
      // En modo repaso `source` es la cola resuelta y se respeta tal cual.
      // En modo normal, filtramos las preguntas excluidas.
      const pool = source ?? questions.filter((q) => !excludedSet.has(q.id))
      const session = generateExamSession(pool, config, null)
      const newSession = {
        questions: session.questions,
        mode,
        truncated: session.truncated,
        startedAt: new Date().toISOString(),
      }
      setExamSession(newSession)
      setResult(null)
      return newSession
    },
    [questions, excludedSet, config]
  )

  const startRetryExam = useCallback(() => {
    const resolved = getRetryQueueQuestions(retryQueue, questions)
    if (resolved.length === 0) return null
    return startExam('retry', resolved)
  }, [retryQueue, questions, startExam])

  const finishExam = useCallback(
    (answers) => {
      if (!examSession) return null
      const finishedAt = new Date().toISOString()
      const newResult = computeResult(
        examSession.questions,
        answers,
        examSession.startedAt,
        finishedAt,
        examSession.mode
      )
      setResult(newResult)
      setRetryQueue((q) => updateRetryQueue(q, newResult))
      setExamSession(null)
      return newResult
    },
    [examSession, setRetryQueue]
  )

  const cancelExam = useCallback(() => {
    setExamSession(null)
  }, [])

  const value = useMemo(
    () => ({
      questions,
      excluded,
      lastUploadAt,
      toggleExclude,
      resetExcluded,
      deleteQuestion,
      clearBank,
      loadQuestions,
      config,
      setConfig,
      retryQueue,
      setRetryQueue,
      examSession,
      startExam,
      startRetryExam,
      finishExam,
      cancelExam,
      result,
    }),
    [
      questions,
      excluded,
      lastUploadAt,
      toggleExclude,
      resetExcluded,
      deleteQuestion,
      clearBank,
      loadQuestions,
      config,
      setConfig,
      retryQueue,
      setRetryQueue,
      examSession,
      result,
      startExam,
      startRetryExam,
      finishExam,
      cancelExam,
    ]
  )

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>
}
