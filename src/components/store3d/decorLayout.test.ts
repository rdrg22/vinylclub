import { describe, expect, it } from 'vitest'
import type { Album } from '@/types/music'
import { buildDecorLayout } from './decorLayout'
import { buildStoreLayout, walkBounds, WALL_X } from './layout'

const album = (id: string, year: number, rank: number, extraYears: number[] = []): Album => ({
  id,
  source: 'musicbrainz',
  title: id,
  artist: 'x',
  charts: [{ year, rank }, ...extraYears.map((y) => ({ year: y, rank: 2 }))],
})

const sixties = [album('a', 1960, 1), album('b', 1961, 1, [1962, 1963]), album('c', 1962, 3)]
const seventies = [album('d', 1970, 1), album('e', 1971, 2)]
const units = buildStoreLayout([
  { decade: '1960s', label: 'Años 60', albums: sixties.map((a) => ({ album: a, year: a.charts![0]!.year, rank: a.charts![0]!.rank })) },
  { decade: '1970s', label: 'Años 70', albums: seventies.map((a) => ({ album: a, year: a.charts![0]!.year, rank: a.charts![0]!.rank })) },
])
const decor = buildDecorLayout(units, { '1960s': sixties, '1970s': seventies })

describe('buildDecorLayout', () => {
  it('cada póster muestra el nº 1 que más años estuvo en la lista de su década', () => {
    expect(decor.posters.map((p) => [p.decadeLabel, p.album.id, p.year])).toEqual([
      ['Años 60', 'b', 1961],
      ['Años 70', 'd', 1970],
    ])
  })

  it('los pósters van pegados a la pared de su mueble', () => {
    for (const poster of decor.posters) expect(Math.abs(poster.x)).toBeGreaterThan(WALL_X)
  })

  it('las cubetas solo contienen números 1', () => {
    const all = decor.crates.flatMap((c) => c.albums)
    expect(all.length).toBeGreaterThan(0)
    for (const a of all) expect(a.charts?.some((c) => c.rank === 1)).toBe(true)
  })

  it('el mostrador queda al fondo, fuera de la zona por la que se camina', () => {
    expect(decor.counter.z).toBeLessThan(walkBounds(units).minZ - 1)
  })

  it('desde el punto de vista del mostrador se mira hacia abajo, al plato', () => {
    expect(decor.counterView.pitch).toBeLessThan(0)
    expect(decor.counterView.pitch).toBeGreaterThan(-0.6)
  })

  it('la gramola y las cubetas son obstáculos', () => {
    expect(decor.obstacles).toHaveLength(3)
  })
})
