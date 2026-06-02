import { useState, useMemo, useCallback } from 'react'
import { useExam } from '../hooks/useExam.js'

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}

export default function QuestionBankEditor({ onBack, onStart }) {
  const {
    questions,
    excluded,
    toggleExclude,
    resetExcluded,
    deleteQuestion,
    clearBank,
  } = useExam()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return questions
    const q = search.toLowerCase()
    return questions.filter((item) => item.text.toLowerCase().includes(q))
  }, [questions, search])

  const excludedSet = useMemo(() => new Set(excluded), [excluded])
  const includedCount = questions.length - excluded.length
  const hasNoneIncluded = includedCount === 0

  const handleClear = useCallback(() => {
    if (questions.length === 0) return
    const ok = window.confirm(
      '¿Limpiar el banco de preguntas? Se borrarán todas las preguntas cargadas, las exclusiones y la cola de repasos. La configuración se mantiene.'
    )
    if (ok) clearBank()
  }, [questions.length, clearBank])

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-800">Revisar banco</h2>
            <p className="mt-1 max-w-prose text-sm text-slate-500">
              Marca las casillas para incluir o excluir preguntas del examen. Usa el cubo de
              basura para eliminarlas del banco por completo.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500">Incluidas</p>
            <p className="text-2xl font-semibold text-indigo-600 tabular-nums">
              {includedCount}
              <span className="text-sm text-slate-400"> / {questions.length}</span>
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <input
            type="search"
            placeholder="Buscar en el banco…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={resetExcluded}
            disabled={excluded.length === 0}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Incluir todas
          </button>
          <button
            onClick={handleClear}
            disabled={questions.length === 0}
            className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            title="Borrar banco y cola de repasos"
          >
            Limpiar banco
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
          {questions.length === 0
            ? 'No hay preguntas en el banco. Vuelve atrás y sube un archivo.'
            : `No hay preguntas que coincidan con «${search}».`}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((q) => {
            const isExcluded = excludedSet.has(q.id)
            return (
              <li
                key={q.id}
                className={`rounded-lg border bg-white p-4 shadow-sm transition-opacity ${
                  isExcluded ? 'border-slate-200 opacity-60' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={!isExcluded}
                    onChange={() => toggleExclude(q.id)}
                    aria-label={`Incluir «${q.text}»`}
                    className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-indigo-600"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p
                        className={`text-sm font-medium ${
                          isExcluded ? 'text-slate-400 line-through' : 'text-slate-800'
                        }`}
                      >
                        {q.text}
                      </p>
                      <span className="shrink-0 text-xs text-slate-500">
                        {q.type === 'multiple' ? 'Multi' : 'Single'} · {q.options.length} opc.
                      </span>
                    </div>
                    <ul className="mt-1.5 space-y-0.5 text-xs">
                      {q.options.map((opt) => (
                        <li
                          key={opt.id}
                          className={
                            opt.isCorrect
                              ? 'font-medium text-emerald-700'
                              : 'text-slate-600'
                          }
                        >
                          <span className="mr-1 text-slate-400">
                            {opt.isCorrect ? '✓' : '○'}
                          </span>
                          {opt.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label={`Eliminar «${q.text}» del banco`}
                    title="Eliminar del banco"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <button
          onClick={onBack}
          className="text-sm font-medium text-indigo-600 underline-offset-2 hover:underline"
        >
          ← Volver a configuración
        </button>
        <button
          onClick={onStart}
          disabled={hasNoneIncluded}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {hasNoneIncluded
            ? 'Sin preguntas para empezar'
            : `Empezar examen (${includedCount})`}
        </button>
      </div>
    </div>
  )
}
