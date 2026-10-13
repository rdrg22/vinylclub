import { describe, expect, it } from 'vitest'
import { formatLength } from './albumBack'

describe('formatLength', () => {
  it('convierte milisegundos a m:ss', () => {
    expect(formatLength(217_000)).toBe('3:37')
    expect(formatLength(59_600)).toBe('1:00')
    expect(formatLength(3_605_000)).toBe('60:05')
  })
  it('no muestra nada si la duración no se conoce', () => {
    expect(formatLength(undefined)).toBe('')
    expect(formatLength(0)).toBe('')
  })
})
