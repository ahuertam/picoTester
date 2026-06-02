/**
 * Formatea una fecha ISO como tiempo relativo en español.
 * Devuelve null si la entrada es null o inválida.
 *
 * Ejemplos:
 *   "hace 5 segundos" / "hace 12 min" / "hace 3 h" / "hace 2 días" / "01/06/2026 17:58"
 */
export function formatRelative(isoString) {
  if (!isoString) return null
  const t = new Date(isoString).getTime()
  if (Number.isNaN(t)) return null

  const diff = Date.now() - t
  const sec = Math.floor(diff / 1000)

  if (sec < 5) return 'hace unos segundos'
  if (sec < 60) return `hace ${sec} s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `hace ${min} min`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `hace ${hr} h`
  const days = Math.floor(hr / 24)
  if (days < 30) return `hace ${days} día${days === 1 ? '' : 's'}`

  // Más de un mes: fecha absoluta
  return new Date(isoString).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formatea una duración en segundos como mm:ss o h:mm:ss.
 */
export function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}
