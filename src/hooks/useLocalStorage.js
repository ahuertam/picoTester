import { useState, useCallback } from 'react'

/**
 * Hook para sincronizar estado con localStorage.
 *
 * @template T
 * @param {string} key - clave en localStorage
 * @param {T} initialValue - valor inicial (o función)
 * @returns {[T, (value: T | ((prev: T) => T)) => void]}
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item != null) return JSON.parse(item)
    } catch (err) {
      console.warn(`useLocalStorage: error al leer "${key}"`, err)
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue
  })

  const setStoredValue = useCallback(
    (newValue) => {
      setValue((prev) => {
        const next = typeof newValue === 'function' ? newValue(prev) : newValue
        try {
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch (err) {
          console.warn(`useLocalStorage: error al escribir "${key}"`, err)
        }
        return next
      })
    },
    [key]
  )

  return [value, setStoredValue]
}
