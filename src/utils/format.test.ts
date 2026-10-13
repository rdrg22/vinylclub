import { describe, expect, it } from 'vitest'
import { countryName, formatPartialDate } from './format'

describe('formatPartialDate', () => {
  it('respeta la precisión de la fuente', () => {
    expect(formatPartialDate('1997-05-21')).toBe('21 may 1997')
    expect(formatPartialDate('1997-05')).toBe('may 1997')
    expect(formatPartialDate('1997')).toBe('1997')
    expect(formatPartialDate(undefined)).toBeUndefined()
  })
})

describe('countryName', () => {
  it('traduce los códigos especiales de MusicBrainz', () => {
    expect(countryName('XW')).toBe('Mundial')
    expect(countryName('XE')).toBe('Europa')
    expect(countryName(undefined)).toBeUndefined()
  })
})
