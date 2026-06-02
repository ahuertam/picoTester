import { describe, it, expect } from 'vitest'
import { formatRelative, formatDuration } from '../format.js'

describe('formatRelative', () => {
  it('devuelve null para null', () => {
    expect(formatRelative(null)).toBe(null)
  })

  it('devuelve null para string inválido', () => {
    expect(formatRelative('not-a-date')).toBe(null)
  })

  it('"hace unos segundos" para menos de 5s', () => {
    const now = new Date().toISOString()
    expect(formatRelative(now)).toBe('hace unos segundos')
  })

  it('"hace N s" entre 5 y 60s', () => {
    const past = new Date(Date.now() - 30 * 1000).toISOString()
    expect(formatRelative(past)).toBe('hace 30 s')
  })

  it('"hace N min" para minutos', () => {
    const past = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    expect(formatRelative(past)).toBe('hace 5 min')
  })

  it('"hace N h" para horas', () => {
    const past = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    expect(formatRelative(past)).toBe('hace 3 h')
  })

  it('"hace N días" en singular y plural', () => {
    const oneDay = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelative(oneDay)).toBe('hace 1 día')
    const fiveDays = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelative(fiveDays)).toBe('hace 5 días')
  })

  it('fecha absoluta para más de 30 días', () => {
    const old = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    const result = formatRelative(old)
    // Acepta "DD/MM/YYYY HH:mm" o "DD/MM/YYYY, HH:mm" según locale (Node suele usar coma).
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}(, )?\d{2}:\d{2}$/)
  })
})

describe('formatDuration', () => {
  it('formatea mm:ss', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(45)).toBe('0:45')
    expect(formatDuration(125)).toBe('2:05')
  })

  it('formatea h:mm:ss cuando supera 1h', () => {
    expect(formatDuration(3600)).toBe('1:00:00')
    expect(formatDuration(3725)).toBe('1:02:05')
  })

  it('clamp a 0 para negativos', () => {
    expect(formatDuration(-10)).toBe('0:00')
  })
})
