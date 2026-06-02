import { useMemo } from 'react'
import { useExam } from '../hooks/useExam.js'

export default function RetryPanel({ onStart }) {
  const { retryQueue, questions } = useExam()

  const items = useMemo(() => {
    const byId = new Map(questions.map((q) => [q.id, q]))
    return retryQueue
      .map((entry) => ({ entry, question: byId.get(entry.questionId) }))
      .filter(({ question }) => question)
  }, [retryQueue, questions])

  if (items.length === 0) return null

  return (
    <section
      aria-labelledby="retry-panel-title"
      className="rounded-lg border border-amber-200 bg-amber-50 p-5"
    >
      <h3 id="retry-panel-title" className="text-sm font-semibold text-amber-900">
        Cola de repaso
      </h3>
      <p className="mt-1 text-sm text-amber-800">
        Tienes {items.length} pregunta{items.length === 1 ? '' : 's'} marcada
        {items.length === 1 ? '' : 's'} para repasar.
      </p>
      <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-sm text-amber-900">
        {items.map(({ entry, question }) => (
          <li
            key={entry.questionId}
            className="flex items-center justify-between gap-3 rounded bg-white/60 px-2 py-1"
          >
            <span className="truncate">{question.text}</span>
            <span className="shrink-0 text-xs text-amber-700">
              {entry.failedCount}× fallida
            </span>
          </li>
        ))}
      </ul>
      <button
        onClick={onStart}
        className="mt-4 w-full rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
      >
        Empezar repaso ({items.length} preguntas)
      </button>
    </section>
  )
}
