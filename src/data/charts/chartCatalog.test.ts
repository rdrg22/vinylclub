import { describe, expect, it } from 'vitest'
import { buildCatalog, CHART_ALBUMS, titleCase, type ChartEntryFile } from './chartCatalog'

const thriller = { id: 'rg-thriller', title: 'Thriller', artist: 'Michael Jackson', artists: [], firstReleaseDate: '1982-11-30', primaryType: 'Album' }

describe('buildCatalog', () => {
  it('une los años de un disco que repite en la lista y lo coloca en el primero', () => {
    const entries: ChartEntryFile[] = [
      { year: 1984, rank: 1, chartTitle: 'THRILLER', chartArtist: 'MICHAEL JACKSON', album: thriller },
      { year: 1983, rank: 1, chartTitle: 'THRILLER', chartArtist: 'MICHAEL JACKSON', album: thriller },
    ]
    const [album, ...rest] = buildCatalog(entries)
    expect(rest).toHaveLength(0)
    expect(album?.charts).toEqual([
      { year: 1983, rank: 1 },
      { year: 1984, rank: 1 },
    ])
    expect(album?.source).toBe('musicbrainz')
    expect(album?.year).toBe(1982)
  })

  it('conserva los discos no localizados sin inventar MBID', () => {
    const [album] = buildCatalog([{ year: 1960, rank: 7, chartTitle: 'SOME ALBUM', chartArtist: 'SOMEONE', album: null }])
    expect(album).toMatchObject({ id: 'chart-1960-7', source: 'chart', title: 'Some Album', artist: 'Someone' })
  })
})

describe('titleCase', () => {
  it('capitaliza los títulos que la lista publica en mayúsculas', () => {
    expect(titleCase('BORN IN THE U.S.A.')).toBe('Born In The U.S.A.')
    expect(titleCase("DON'T STOP")).toBe("Don't Stop")
    expect(titleCase('HELLO, DOLLY! (ORIGINAL CAST)')).toBe('Hello, Dolly! (Original Cast)')
  })
})

describe('catálogo generado', () => {
  it('no tiene identificadores repetidos', () => {
    const ids = CHART_ALBUMS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('cada disco tiene al menos un puesto de 1 a 10', () => {
    for (const album of CHART_ALBUMS) {
      expect(album.charts?.length).toBeGreaterThan(0)
      for (const chart of album.charts ?? []) expect(chart.rank).toBeGreaterThanOrEqual(1)
      for (const chart of album.charts ?? []) expect(chart.rank).toBeLessThanOrEqual(10)
    }
  })
})
