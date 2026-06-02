import { useExam } from '../hooks/useExam.js'
import { formatRelative } from '../utils/format.js'

export default function ConfigPanel({ onStart, onReview, onChangeFile }) {
  const { config, setConfig, questions, excluded, startExam, clearBank, lastUploadAt } = useExam()

  function update(patch) {
    setConfig((c) => ({ ...c, ...patch }))
  }

  const bankSize = questions.length
  const includedSize = bankSize - excluded.size
  const count = Math.min(config.questionCount, includedSize) || 1
  const tooMany = config.questionCount > includedSize

  function handleStart() {
    if (includedSize === 0) return
    setConfig((c) => ({
      ...c,
      questionCount: Math.min(c.questionCount, includedSize) || includedSize,
    }))
    startExam('normal')
    onStart()
  }

  function handleClear() {
    if (bankSize === 0) return
    const ok = window.confirm(
      '¿Limpiar el banco de preguntas? Se borrarán las preguntas cargadas, las exclusiones y la cola de repasos. La configuración se mantiene.'
    )
    if (ok) clearBank()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Configura el examen</h2>
            <p className="mt-1 text-sm text-slate-500">
              Banco cargado:{' '}
              <span className="font-medium text-slate-700">{bankSize}</span> pregunta
              {bankSize === 1 ? '' : 's'}
              {excluded.size > 0 && (
                <>
                  {' '}
                  ·{' '}
                  <span className="text-amber-700">
                    {excluded.size} excluida{excluded.size === 1 ? '' : 's'}
                  </span>
                </>
              )}
              {lastUploadAt && (
                <>
                  {' '}
                  ·{' '}
                  <span
                    className="text-slate-500"
                    title={new Date(lastUploadAt).toLocaleString('es-ES')}
                  >
                    cargado {formatRelative(lastUploadAt)}
                  </span>
                </>
              )}
              .
            </p>
          </div>
          <button
            onClick={onReview}
            disabled={bankSize === 0}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Revisar banco
          </button>
          <button
            onClick={handleClear}
            disabled={bankSize === 0}
            className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            title="Borrar el banco y la cola de repasos"
          >
            Limpiar banco
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <Field label="Tiempo por examen (minutos)">
            <input
              id="timePerExam"
              type="number"
              min={0}
              max={600}
              value={config.timePerExam}
              onChange={(e) => update({ timePerExam: Math.max(0, Number(e.target.value) || 0) })}
              className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-slate-500">0 = sin límite de tiempo.</p>
          </Field>

          <Field label="Número de preguntas">
            <input
              id="questionCount"
              type="number"
              min={1}
              max={includedSize || 1}
              value={count}
              disabled={includedSize === 0}
              onChange={(e) =>
                update({
                  questionCount: Math.max(
                    1,
                    Math.min(includedSize, Number(e.target.value) || 1)
                  ),
                })
              }
              className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
            {tooMany && (
              <p className="mt-1 text-xs text-amber-700">
                Solo hay {includedSize} preguntas incluidas; se usarán todas.
              </p>
            )}
          </Field>

          <ToggleField
            id="randomOrder"
            label="Orden aleatorio"
            description="Baraja preguntas y opciones en cada examen."
            checked={config.randomOrder}
            onChange={(v) => update({ randomOrder: v })}
          />

          <ToggleField
            id="showResultImmediately"
            label="Feedback inmediato"
            description="Muestra si la respuesta es correcta al confirmar."
            checked={config.showResultImmediately}
            onChange={(v) => update({ showResultImmediately: v })}
          />

          <Field label="Navegación">
            <div className="flex gap-4">
              <Radio
                id="nav-free"
                name="navigationMode"
                value="free"
                checked={config.navigationMode === 'free'}
                onChange={() => update({ navigationMode: 'free' })}
                label="Libre (atrás/adelante)"
              />
              <Radio
                id="nav-sequential"
                name="navigationMode"
                value="sequential"
                checked={config.navigationMode === 'sequential'}
                onChange={() => update({ navigationMode: 'sequential' })}
                label="Secuencial (solo siguiente)"
              />
            </div>
          </Field>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={onChangeFile}
            className="text-sm font-medium text-indigo-600 underline-offset-2 hover:underline"
          >
            ← Subir otro archivo
          </button>
          <button
            onClick={handleStart}
            disabled={includedSize === 0}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {includedSize === 0 ? 'Sin preguntas para empezar' : 'Empezar examen'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

function ToggleField({ id, label, description, checked, onChange }) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
      />
      <div>
        <label htmlFor={id} className="cursor-pointer text-sm font-medium text-slate-700">
          {label}
        </label>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
  )
}

function Radio({ id, name, value, checked, onChange, label }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 cursor-pointer accent-indigo-600"
      />
      {label}
    </label>
  )
}
