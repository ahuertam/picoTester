import { useState } from 'react'
import Header from './components/Header.jsx'

// Estados de la máquina de vistas
const VIEW = {
  UPLOAD: 'upload',
  CONFIG: 'config',
  EXAM: 'exam',
  RESULTS: 'results',
}

export default function App() {
  const [view, setView] = useState(VIEW.UPLOAD)

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {view === VIEW.UPLOAD && (
          <Placeholder title="Subir .md" onNext={() => setView(VIEW.CONFIG)} />
        )}
        {view === VIEW.CONFIG && (
          <Placeholder title="Configurar examen" onNext={() => setView(VIEW.EXAM)} />
        )}
        {view === VIEW.EXAM && (
          <Placeholder title="Hacer examen" onNext={() => setView(VIEW.RESULTS)} />
        )}
        {view === VIEW.RESULTS && (
          <div className="space-y-4">
            <Placeholder title="Resultados" />
            <div className="flex gap-3">
              <button
                onClick={() => setView(VIEW.EXAM)}
                className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              >
                Repasar fallos
              </button>
              <button
                onClick={() => setView(VIEW.CONFIG)}
                className="rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
              >
                Nuevo examen
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// Placeholder temporal — se reemplaza por componentes reales en tareas posteriores.
function Placeholder({ title, onNext }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">(vista en construcción)</p>
      {onNext && (
        <button
          onClick={onNext}
          className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Siguiente
        </button>
      )}
    </div>
  )
}
