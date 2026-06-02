export default function ProgressBar({ current, total }) {
  const pct = total === 0 ? 0 : Math.round(((current + 1) / total) * 100)
  const remaining = Math.max(0, total - current - 1)
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
        <span>
          Pregunta {current + 1} de {total}
        </span>
        <span>
          {remaining === 0 ? 'última pregunta' : `${remaining} restante${remaining === 1 ? '' : 's'}`}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progreso del examen: pregunta ${current + 1} de ${total}, ${remaining} restantes`}
      >
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
