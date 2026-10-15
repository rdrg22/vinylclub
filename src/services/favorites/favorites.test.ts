import { describe, expect, it } from 'vitest'
import type { Album } from '@/types/music'
import { albumFromFavorite, toFavoriteDoc } from './favorites'

const fromSearch: Album = {
  id: '33333333-3333-3333-3333-333333333333',
  source: 'musicbrainz',
  title: 'Random Access Memories',
  artist: 'Daft Punk',
  year: 2013,
  firstReleaseDate: '2013-05-17',
}

const fromChart: Album = {
  id: 'chart-1977-1',
  source: 'chart',
  title: 'Rumours',
  artist: 'Fleetwood Mac',
  charts: [{ year: 1977, rank: 1 }, { year: 1978, rank: 4 }],
}

describe('favoritos en la cuenta', () => {
  it('guarda una copia mínima sin campos vacíos', () => {
    expect(toFavoriteDoc(fromSearch)).toEqual({
      albumId: fromSearch.id, source: 'musicbrainz', title: 'Random Access Memories', artist: 'Daft Punk', year: 2013, firstReleaseDate: '2013-05-17',
    })
    const chart = toFavoriteDoc(fromChart)
    expect(chart).toMatchObject({ chartYear: 1977, chartRank: 1 })
    expect(chart).not.toHaveProperty('year')
  })

  it('usa el disco del catálogo si lo conoce (con todos sus puestos)', () => {
    const catalog = new Map([[fromChart.id, fromChart]])
    expect(albumFromFavorite(toFavoriteDoc(fromChart), catalog)).toBe(fromChart)
  })

  it('reconstruye los discos que no están en la tienda', () => {
    const album = albumFromFavorite(toFavoriteDoc(fromSearch), new Map())
    expect(album).toMatchObject({ id: fromSearch.id, title: 'Random Access Memories', year: 2013, charts: undefined })
  })
})
