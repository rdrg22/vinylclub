import { describe, expect, it } from 'vitest'
import type { Album } from '@/types/music'
import { buildStoreLayout, COVER_SIZE, PER_HALF, UNIT_WIDTH, walkBounds } from './layout'

const album = (id: string): Album => ({ id, source: 'musicbrainz', title: id, artist: 'x' })
const decade = (years: number[], perYear = 10) =>
  years.flatMap((year) => Array.from({ length: perYear }, (_, i) => ({ album: album(`${year}-${i + 1}`), year, rank: i + 1 })))

describe('buildStoreLayout', () => {
  const units = buildStoreLayout([
    { decade: '1950s', label: 'Años 50', albums: decade([1956, 1957, 1958, 1959]) },
    { decade: '1960s', label: 'Años 60', albums: decade([1960, 1961, 1962, 1963, 1964, 1965, 1966, 1967, 1968, 1969]) },
    { decade: '1970s', label: 'Años 70', albums: decade([1970]) },
  ])

  it('alterna paredes en orden cronológico y avanza por el pasillo', () => {
    expect(units.map((u) => u.side)).toEqual(['left', 'right', 'left'])
    expect(units[0]!.center[2]).toBe(units[1]!.center[2])
    expect(units[2]!.center[2]).toBeLessThan(units[0]!.center[2])
  })

  it('coloca 10 años en 5 baldas y todos los discos dentro del mueble', () => {
    const sixties = units[1]!
    expect(sixties.slots).toHaveLength(100)
    expect(new Set(sixties.slots.map((s) => s.y)).size).toBe(5)
    for (const slot of sixties.slots) {
      expect(Math.abs(slot.x) + COVER_SIZE / 2).toBeLessThanOrEqual(UNIT_WIDTH / 2)
    }
  })

  it('ordena cada año por puesto, de izquierda a derecha', () => {
    const fifties = units[0]!
    const row1956 = fifties.slots.filter((s) => s.album.id.startsWith('1956'))
    expect(row1956.map((s) => s.album.id)).toEqual(Array.from({ length: PER_HALF }, (_, i) => `1956-${i + 1}`))
    expect(row1956.every((s, i, all) => i === 0 || s.x > all[i - 1]!.x)).toBe(true)
  })

  it('centra verticalmente las décadas con pocos años', () => {
    const seventies = units[2]!
    expect(new Set(seventies.slots.map((s) => s.y))).toEqual(new Set([1.29]))
  })

  it('el punto de vista mira hacia el mueble desde el pasillo', () => {
    for (const unit of units) {
      const [x] = unit.viewpoint.position
      const lookX = -Math.sin(unit.viewpoint.yaw)
      // La cámara está dentro del pasillo y mira hacia la pared del mueble.
      expect(Math.sign(lookX)).toBe(Math.sign(unit.center[0]))
      expect(Math.abs(x)).toBeLessThan(Math.abs(unit.center[0]))
    }
  })

  it('los límites del pasillo no atraviesan los muebles', () => {
    const bounds = walkBounds(units)
    expect(bounds.minX).toBeGreaterThan(units[0]!.center[0])
    expect(bounds.maxX).toBeLessThan(units[1]!.center[0])
  })
})
