function format(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Timer({ secondsLeft }) {
  const isLow = secondsLeft <= 60
  return (
    <div
      className={`rounded-md border px-3 py-1.5 font-mono text-sm tabular-nums ${
        isLow ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-700'
      }`}
      aria-label={`Tiempo restante: ${format(secondsLeft)}`}
    >
      ⏱ {format(secondsLeft)}
    </div>
  )
}
