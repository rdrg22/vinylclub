import { describe, expect, it } from 'vitest'
import { whenPlayed } from './plays'

describe('cuándo sonó', () => {
  const now = new Date(2026, 9, 15, 18, 30)

  it('lo reciente, en minutos', () => {
    expect(whenPlayed(new Date(2026, 9, 15, 18, 29, 50).toISOString(), now)).toBe('hace un momento')
    expect(whenPlayed(new Date(2026, 9, 15, 18, 18).toISOString(), now)).toBe('hace 12 min')
  })

  it('hoy y ayer, con la hora', () => {
    expect(whenPlayed(new Date(2026, 9, 15, 9, 5).toISOString(), now)).toBe('hoy 09:05')
    expect(whenPlayed(new Date(2026, 9, 14, 22, 10).toISOString(), now)).toBe('ayer 22:10')
  })

  it('lo anterior, con la fecha', () => {
    expect(whenPlayed(new Date(2026, 9, 3, 12, 0).toISOString(), now)).toBe('3 oct')
  })
})
