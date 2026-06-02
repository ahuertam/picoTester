import { useMemo } from 'react'
import { useExam } from '../hooks/useExam.js'
import RetryPanel from './RetryPanel.jsx'

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function scoreTone(score) {
  if (score >= 7) return 'text-emerald-600'
  if (score >= 5) return 'text-amber-600'
  return 'text-red-600'
}

function optionClasses(option, isSelected, showFeedback) {
  const base = 'flex items-start gap-2 rounded border px-2 py-1.5 text-sm'
  if (!showFeedback) return `${base} border-slate-200 bg-slate-50`
  if (option.isCorrect) return `${base} border-emerald-400 bg-emerald-50`
  if (isSelected) return `${base} border-red-400 bg-red-50`
  return `${base} border-slate-200 bg-white text-slate-500`
}

export default function ResultsView({ onRetry, onNew, onChangeFile }) {
  const { result, questions } = useExam()

  const byId = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions])

  if (!result) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        No hay resultados para mostrar.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <section
        aria-labelledby="results-summary-title"
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 id="results-summary-title" className="text-lg font-semibold text-slate-800">
          Resultados
        </h2>

        <div className="mt-4 flex items-baseline gap-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Nota</p>
            <p className={`text-4xl font-bold tabular-nums ${scoreTone(result.score)}`}>
              {result.score.toFixed(1)}
              <span className="text-base text-slate-400"> / 10</span>
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Porcentaje</p>
            <p className="text-2xl font-semibold text-slate-700 tabular-nums">
              {result.percentage}%
            </p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="Aciertos" value={result.correct} tone="text-emerald-700" />
          <Stat label="Fallos" value={result.incorrect} tone="text-red-700" />
          <Stat label="En blanco" value={result.blank} tone="text-slate-600" />
          <Stat label="Duración" value={formatDuration(result.durationSeconds)} />
        </dl>

        {result.truncated && (
          <p className="mt-3 text-xs text-amber-700">
            El banco tenía menos preguntas de las pedidas; se usaron todas las disponibles.
          </p>
        )}
      </section>

      <RetryPanel onStart={onRetry} />

      <section
        aria-labelledby="results-review-title"
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h3 id="results-review-title" className="text-sm font-semibold text-slate-800">
          Revisión detallada
        </h3>
        <ol className="mt-4 space-y-5">
          {result.answers.map((a, idx) => {
            const q = byId.get(a.questionId)
            if (!q) return null
            return (
              <li key={a.questionId} className="border-b border-slate-100 pb-4 last:border-0">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium text-slate-800">
                    <span className="mr-2 text-slate-400">{idx + 1}.</span>
                    {q.text}
                  </p>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                      a.blank
                        ? 'bg-slate-100 text-slate-600'
                        : a.isCorrect
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {a.blank ? 'En blanco' : a.isCorrect ? 'Correcta' : 'Incorrecta'}
                  </span>
                </div>
                <ul className="mt-2 space-y-1">
                  {q.options.map((opt) => (
                    <li key={opt.id} className={optionClasses(opt, a.selected.includes(opt.id), true)}>
                      <span className="font-mono text-xs text-slate-400">
                        {a.selected.includes(opt.id) ? '☑' : '☐'}
                      </span>
                      <span className="flex-1">{opt.text}</span>
                      {opt.isCorrect && (
                        <span className="text-xs text-emerald-700">Correcta</span>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ol>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onChangeFile}
          className="text-sm font-medium text-indigo-600 underline-offset-2 hover:underline"
        >
          ← Subir otro archivo
        </button>
        <button
          onClick={onNew}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          Nuevo examen
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value, tone = 'text-slate-800' }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={`text-lg font-semibold tabular-nums ${tone}`}>{value}</dd>
    </div>
  )
}
