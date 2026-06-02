import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Cuenta atrás en segundos. Cuando llega a 0 invoca `onExpire` una sola vez.
 *
 * @param {number} initialSeconds - 0 = sin límite (no inicia timer)
 * @param {() => void} onExpire
 * @returns {{ secondsLeft: number, reset: (newSeconds?: number) => void }}
 */
export function useTimer(initialSeconds, onExpire) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const onExpireRef = useRef(onExpire)
  const expiredRef = useRef(false)

  // Mantener el callback actualizado sin re-disparar el efecto de countdown.
  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  // Reset cuando cambia el tiempo inicial (p. ej. nuevo examen).
  useEffect(() => {
    expiredRef.current = false
    setSecondsLeft(initialSeconds)
  }, [initialSeconds])

  // Countdown
  useEffect(() => {
    if (initialSeconds <= 0) return
    if (secondsLeft <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true
        onExpireRef.current?.()
      }
      return
    }
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [secondsLeft, initialSeconds])

  const reset = useCallback(
    (newSeconds) => {
      expiredRef.current = false
      setSecondsLeft(newSeconds ?? initialSeconds)
    },
    [initialSeconds]
  )

  return { secondsLeft, reset }
}
