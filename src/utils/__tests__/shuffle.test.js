import { describe, it, expect } from 'vitest'
import { shuffle } from '../shuffle.js'

describe('shuffle', () => {
  it('devuelve un array del mismo tamaño', () => {
    const arr = [1, 2, 3, 4, 5]
    const result = shuffle(arr)
    expect(result).toHaveLength(5)
  })

  it('no muta el array original', () => {
    const arr = [1, 2, 3, 4, 5]
    const copy = arr.slice()
    shuffle(arr)
    expect(arr).toEqual(copy)
  })

  it('contiene los mismos elementos', () => {
    const arr = [1, 2, 3, 4, 5]
    const result = shuffle(arr)
    expect([...result].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5])
  })

  it('maneja arrays vacíos', () => {
    expect(shuffle([])).toEqual([])
  })

  it('maneja arrays de un solo elemento', () => {
    expect(shuffle([42])).toEqual([42])
  })
})
