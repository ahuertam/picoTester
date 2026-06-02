import { useState, useEffect, useCallback, useMemo } from 'react'
import { useExam } from '../hooks/useExam.js'
import { useTimer } from '../hooks/useTimer.js'
import QuestionCard from './QuestionCard.jsx'
import ProgressBar from './ProgressBar.jsx'
import Timer from './Timer.jsx'

export default function ExamView({ onFinish, onCancel }) {
  const { examSession, config, finishExam, cancelExam } = useExam()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({}) // questionId -> string[]
  const [feedbackShown, setFeedbackShown] = useState({}) // questionId -> true

  // Si cambia la sesión (p. ej. repaso), reinicia estado local
  useEffect(() => {
    setCurrentIdx(0)
    setAnswers({})
    setFeedbackShown({})
  }, [examSession])

  const question = examSession?.questions[currentIdx]
  const total = examSession?.questions.length ?? 0
  const selected = question ? answers[question.id] || [] : []
  const showFeedback = question ? !!feedbackShown[question.id] : false
  const isLast = currentIdx === total - 1
  const isFree = config.navigationMode === 'free'

  // Auto-submit al expirar el tiempo
  const handleFinish = useCallback(() => {
    if (!examSession) return
    const answerList = buildAnswerList(examSession.questions, answers)
    finishExam(answerList)
    onFinish()
  }, [examSession, answers, finishExam, onFinish])

  const timeLimit = useMemo(() => config.timePerExam * 60, [config.timePerExam])
  const { secondsLeft } = useTimer(timeLimit, handleFinish)

  const toggleOption = (optionId) => {
    if (!question || showFeedback) return
    setAnswers((prev) => {
      const current = prev[question.id] || []
      const isMulti = question.type === 'multiple'
      const next = isMulti
        ? current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId]
        : [optionId]
      return { ...prev, [question.id]: next }
    })
  }

  const handleConfirm = () => {
    if (!question) return
    if (config.showResultImmediately && !showFeedback) {
      setFeedbackShown((prev) => ({ ...prev, [question.id]: true }))
      return
    }
    if (isLast) {
      handleFinish()
    } else {
      setCurrentIdx((i) => i + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIdx > 0) setCurrentIdx((i) => i - 1)
  }

  const handleStop = useCallback(() => {
    if (!examSession) return
    const ok = window.confirm(
      '¿Parar el examen? Perderás el progreso de las preguntas no enviadas y volverás a la configuración.'
    )
    if (!ok) return
    cancelExam()
    if (onCancel) onCancel()
  }, [examSession, cancelExam, onCancel])

  if (!examSession || !question) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        No hay sesión de examen activa.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {examSession.mode === 'retry' && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Modo repaso — solo se muestran las preguntas que fallaste en exámenes anteriores.
        </div>
      )}

      <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="min-w-0 flex-1">
          <ProgressBar current={currentIdx} total={total} />
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {timeLimit > 0 && <Timer secondsLeft={secondsLeft} />}
          <button
            onClick={handleStop}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
            title="Parar el examen y volver a configuración"
          >
            ✕ Parar
          </button>
        </div>
      </div>

      <QuestionCard
        question={question}
        selected={selected}
        showFeedback={showFeedback}
        onToggle={toggleOption}
        onConfirm={handleConfirm}
        onPrevious={handlePrevious}
        canGoBack={isFree && currentIdx > 0}
        isLast={isLast}
      />
    </div>
  )
}

function buildAnswerList(questions, answers) {
  return questions.map((q) => ({
    questionId: q.id,
    selected: answers[q.id] || [],
  }))
}
