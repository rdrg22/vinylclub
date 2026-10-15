import { describe, expect, it } from 'vitest'
import type { Album } from '@/types/music'
import { buildDecorLayout } from './decorLayout'
import { buildCollectionUnit, buildStoreLayout, COLLECTION_KEY, WALL_X } from './layout'
import { buildFloorSpots, ENTRANCE_SPOT } from './spots'

const album = (id: string): Album => ({ id, source: 'musicbrainz', title: id, artist: 'x', charts: [{ year: 1960, rank: 1 }] })

describe('marcas del suelo', () => {
  const decades = buildStoreLayout([
    { decade: '1950s', label: 'Años 50', albums: [{ album: album('a'), year: 1956, rank: 1 }] },
    { decade: '1960s', label: 'Años 60', albums: [{ album: album('b'), year: 1960, rank: 1 }] },
  ])
  const units = [...decades, buildCollectionUnit(decades.length, [])]
  const decor = buildDecorLayout(units, { '1960s': [album('b')] })
  const spots = buildFloorSpots(units, decor)

  it('tiene entrada, gramola, cubetas, un sitio por mueble y el mostrador', () => {
    expect(spots.map((s) => s.id)).toEqual([ENTRANCE_SPOT, 'gramola', 'cubetas', '1950s', '1960s', COLLECTION_KEY, 'mostrador'])
  })

  it('las marcas de cada mueble apuntan a su pared', () => {
    const left = spots.find((s) => s.id === '1950s')!
    const right = spots.find((s) => s.id === '1960s')!
    expect(left.x).toBeLessThan(0)
    expect(left.facing).toBeCloseTo(Math.PI / 2)
    expect(right.x).toBeGreaterThan(0)
    expect(right.facing).toBeCloseTo(-Math.PI / 2)
  })

  it('todas quedan dentro del pasillo', () => {
    for (const s of spots) expect(Math.abs(s.x)).toBeLessThan(WALL_X - 0.5)
  })

  it('no se pisan entre sí', () => {
    for (const a of spots)
      for (const b of spots) if (a !== b) expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThan(1.2)
  })
})
