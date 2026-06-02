import { useState, useRef, useCallback, useMemo } from 'react'
import { parseMarkdown } from '../utils/markdownParser.js'
import { useExam } from '../hooks/useExam.js'

const TEMPLATE_PATH = '/plantilla-ejemplo.md'
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const MD_RE = /\.md$|\.markdown$/i

export default function FileDropzone({ onContinue }) {
  const { loadQuestions } = useExam()
  const [parsedFiles, setParsedFiles] = useState([]) // [{ name, parsed: { questions, errors } }]
  const [isDragging, setIsDragging] = useState(false)
  const [ignoredCount, setIgnoredCount] = useState(0)
  const inputRef = useRef(null)

  const handleFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList)
    if (files.length === 0) return

    const mdFiles = files.filter((f) => MD_RE.test(f.name))
    setIgnoredCount(files.length - mdFiles.length)

    if (mdFiles.length === 0) {
      setParsedFiles([])
      return
    }

    const results = await Promise.all(
      mdFiles.map(async (file) => {
        if (file.size > MAX_BYTES) {
          return {
            name: file.name,
            parsed: {
              questions: [],
              errors: [
                {
                  type: 'too_big',
                  severity: 'fatal',
                  message: `Supera el tamaño máximo de 5 MB.`,
                },
              ],
            },
          }
        }
        try {
          const text = await file.text()
          return { name: file.name, parsed: parseMarkdown(text) }
        } catch (err) {
          return {
            name: file.name,
            parsed: {
              questions: [],
              errors: [
                { type: 'read_error', severity: 'fatal', message: 'No se pudo leer el archivo.' },
              ],
            },
          }
        }
      })
    )

    setParsedFiles(results)
  }, [])

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
  }

  const onSelect = (e) => {
    if (e.target.files?.length) handleFiles(e.target.files)
    // Reset para permitir volver a seleccionar los mismos archivos
    e.target.value = ''
  }

  // Preguntas combinadas (re-indexadas para evitar colisión de IDs entre archivos).
  const allQuestions = useMemo(() => {
    const all = []
    parsedFiles.forEach(({ parsed }) => {
      for (const q of parsed.questions) all.push(q)
    })
    all.forEach((q, i) => {
      q.id = `q-${i}`
      q.options.forEach((o, j) => {
        o.id = `q-${i}-o-${j}`
      })
    })
    return all
  }, [parsedFiles])

  const fatalErrors = useMemo(() => {
    const list = []
    parsedFiles.forEach(({ name, parsed }) => {
      for (const e of parsed.errors) {
        if (e.severity === 'fatal') list.push({ ...e, fileName: name })
      }
    })
    return list
  }, [parsedFiles])

  const warnings = useMemo(() => {
    const list = []
    parsedFiles.forEach(({ name, parsed }) => {
      for (const e of parsed.errors) {
        if (e.severity === 'warning') list.push({ ...e, fileName: name })
      }
    })
    return list
  }, [parsedFiles])

  const canContinue =
    parsedFiles.length > 0 && fatalErrors.length === 0 && allQuestions.length > 0

  function handleContinue() {
    if (canContinue) {
      loadQuestions(allQuestions)
      onContinue()
    }
  }

  function handleReset() {
    setParsedFiles([])
    setIgnoredCount(0)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Sube tu banco de preguntas</h2>
        <p className="mt-1 text-sm text-slate-500">
          Arrastra uno o varios archivos <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">.md</code> o
          selecciónalos desde tu equipo. Formato: cada pregunta empieza con{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">##</code> y las opciones usan{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">- [ ]</code> /{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">- [x]</code>. Si subes varios, se
          concatenan en un único banco.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Subir archivos markdown"
          className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-10 text-center transition-colors ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
          }`}
        >
          <span className="text-3xl">📄</span>
          <p className="mt-2 text-sm font-medium text-slate-700">
            Arrastra aquí tus <code className="rounded bg-white px-1 text-xs">.md</code> o haz clic
            para seleccionar
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Puedes subir varios a la vez · tamaño máx. 5 MB por archivo
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".md,.markdown,text/markdown"
            multiple
            onChange={onSelect}
            className="hidden"
          />
        </div>

        <p className="mt-3 text-xs text-slate-500">
          ¿No tienes uno?{' '}
          <a
            href={TEMPLATE_PATH}
            download
            className="font-medium text-indigo-600 underline-offset-2 hover:underline"
          >
            Descargar plantilla de ejemplo
          </a>
        </p>
      </div>

      {parsedFiles.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">
              Archivos cargados ({parsedFiles.length})
            </h3>
            <button
              onClick={handleReset}
              className="text-xs font-medium text-slate-500 underline-offset-2 hover:underline"
            >
              Limpiar
            </button>
          </div>

          {ignoredCount > 0 && (
            <p className="mt-2 text-xs text-amber-700">
              Se ignoraron {ignoredCount} archivo{ignoredCount === 1 ? '' : 's'} sin extensión .md.
            </p>
          )}

          <ul className="mt-3 space-y-1.5 text-sm">
            {parsedFiles.map(({ name, parsed }) => {
              const fileFatals = parsed.errors.filter((e) => e.severity === 'fatal').length
              const ok = fileFatals === 0 && parsed.questions.length > 0
              const empty = fileFatals === 0 && parsed.questions.length === 0
              return (
                <li
                  key={name}
                  className="flex items-center justify-between gap-3 rounded border border-slate-200 bg-slate-50 px-3 py-1.5"
                >
                  <span className="truncate font-mono text-xs text-slate-700">{name}</span>
                  <span
                    className={`shrink-0 text-xs ${
                      ok ? 'text-emerald-700' : empty ? 'text-slate-500' : 'text-red-700'
                    }`}
                  >
                    {ok
                      ? `${parsed.questions.length} pregunta${parsed.questions.length === 1 ? '' : 's'}`
                      : empty
                        ? 'sin preguntas válidas'
                        : `${fileFatals} error${fileFatals === 1 ? '' : 'es'} fatal${fileFatals === 1 ? '' : 'es'}`}
                  </span>
                </li>
              )
            })}
          </ul>

          <div className="mt-5 border-t border-slate-100 pt-4">
            {fatalErrors.length > 0 ? (
              <>
                <h4 className="text-sm font-semibold text-red-700">
                  ❌ No se puede continuar ({fatalErrors.length} error
                  {fatalErrors.length === 1 ? '' : 'es'} fatal
                  {fatalErrors.length === 1 ? '' : 'es'})
                </h4>
                <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-slate-700">
                  {fatalErrors.map((err, i) => (
                    <li key={i}>
                      <span className="font-mono">{err.fileName}</span>: {err.message}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-emerald-700">
                  ✅ Total: {allQuestions.length} pregunta{allQuestions.length === 1 ? '' : 's'}{' '}
                  válida{allQuestions.length === 1 ? '' : 's'}
                </p>
                {warnings.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-amber-700">
                      {warnings.length} aviso{warnings.length === 1 ? '' : 's'} (no bloqueante)
                    </summary>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-slate-600">
                      {warnings.map((err, i) => (
                        <li key={i}>
                          <span className="font-mono">{err.fileName}</span>: {err.message}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </>
            )}
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
