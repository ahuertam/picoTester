function optionClasses(option, selected, showFeedback) {
  const base =
    'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors focus-within:ring-2 focus-within:ring-indigo-500'
  if (!showFeedback) {
    return `${base} ${
      selected.includes(option.id)
        ? 'border-indigo-500 bg-indigo-50'
        : 'border-slate-200 hover:bg-slate-50'
    }`
  }
  if (option.isCorrect) {
    return `${base} border-emerald-500 bg-emerald-50`
  }
  if (selected.includes(option.id)) {
    return `${base} border-red-500 bg-red-50`
  }
  return `${base} border-slate-200 bg-white text-slate-500`
}

export default function QuestionCard({
  question,
  selected,
  showFeedback,
  onToggle,
  onConfirm,
  onPrevious,
  canGoBack,
  isLast,
}) {
  const isMulti = question.type === 'multiple'
  const hasSelection = selected.length > 0
  const confirmLabel = showFeedback
    ? isLast
      ? 'Finalizar'
      : 'Siguiente'
    : isMulti
      ? 'Confirmar'
      : 'Siguiente'

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-indigo-600">
        {isMulti ? 'Pregunta multi-respuesta' : 'Pregunta'}
      </p>
      <h2 className="mb-5 text-lg font-semibold text-slate-800">{question.text}</h2>

      <ul className="space-y-2">
        {question.options.map((option) => {
          const id = `${question.id}-${option.id}`
          const isChecked = selected.includes(option.id)
          return (
            <li key={option.id}>
              <label htmlFor={id} className={optionClasses(option, selected, showFeedback)}>
                <input
                  id={id}
                  type={isMulti ? 'checkbox' : 'radio'}
                  name={question.id}
                  value={option.id}
                  checked={isChecked}
                  disabled={showFeedback}
                  onChange={() => onToggle(option.id)}
                  className="mt-1 h-4 w-4 cursor-pointer accent-indigo-600 disabled:cursor-not-allowed"
                />
                <span className="flex-1 text-sm text-slate-800">{option.text}</span>
                {showFeedback && option.isCorrect && (
                  <span className="text-xs font-medium text-emerald-700">Correcta</span>
                )}
                {showFeedback && !option.isCorrect && isChecked && (
                  <span className="text-xs font-medium text-red-700">Tu respuesta</span>
                )}
              </label>
            </li>
          )
        })}
      </ul>

      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="w-24">
          {canGoBack ? (
            <button
              onClick={onPrevious}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              ← Anterior
            </button>
          ) : null}
        </div>
        <p className="flex-1 text-center text-xs text-slate-500" aria-live="polite">
          {showFeedback
            ? 'Revisa la respuesta y pulsa Siguiente.'
            : isMulti
              ? 'Marca una o más opciones y pulsa Confirmar.'
              : 'Selecciona una opción para continuar.'}
        </p>
        <button
          onClick={onConfirm}
          disabled={!hasSelection}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {confirmLabel}
        </button>
      </div>
    </article>
  )
}
