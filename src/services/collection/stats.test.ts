import { describe, expect, it } from 'vitest'
import type { Album } from '@/types/music'
import type { CollectionItem } from './collection'
import { computeCollectionStats } from './stats'

let n = 0
const item = (over: Partial<CollectionItem>): CollectionItem => ({
  id: `i${++n}`,
  releaseId: `r${n}`,
  albumId: `a${n}`,
  title: 'Disco',
  artist: 'Artista',
  formats: ['12" Vinyl'],
  labels: [],
  addedAt: '2026-10-15T10:00:00Z',
  ...over,
})

describe('estadísticas de la colección', () => {
  const items = [
    item({ artist: 'Fleetwood Mac', albumId: 'rumours', date: '1977-02-04' }),
    item({ artist: 'fleetwood mac ', albumId: 'rumours', date: '2004', formats: ['CD'] }),
    item({ artist: 'Daft Punk', date: '2013-05-17' }),
    item({ artist: 'Pink Floyd', date: '1979-11-30', formats: ['Cassette'] }),
    item({ artist: 'Desconocido', date: undefined }),
  ]
  const catalog = new Map<string, Album>([
    ['rumours', { id: 'rumours', source: 'musicbrainz', title: 'Rumours', artist: 'Fleetwood Mac', charts: [{ year: 1977, rank: 1 }] }],
  ])
  const stats = computeCollectionStats(items, catalog)

  it('cuenta formatos', () => {
    expect(stats.total).toBe(5)
    expect(stats.formats).toEqual({ vinyl: 3, cd: 1, other: 1 })
  })

  it('agrupa por década y aparta las ediciones sin fecha', () => {
    expect(stats.decades).toEqual([
      { decade: 1970, count: 2 },
      { decade: 2000, count: 1 },
      { decade: 2010, count: 1 },
    ])
    expect(stats.undated).toBe(1)
  })

  it('artistas repetidos, sin distinguir mayúsculas ni espacios', () => {
    expect(stats.topArtists).toEqual([{ artist: 'Fleetwood Mac', count: 2 }])
  })

  it('el más antiguo y el más reciente', () => {
    expect(stats.oldest?.date).toBe('1977-02-04')
    expect(stats.newest?.date).toBe('2013-05-17')
  })

  it('cada disco cuenta una vez en las listas aunque tengas dos ediciones', () => {
    expect(stats.numberOnes).toBe(1)
    expect(stats.inCharts).toBe(1)
  })

  it('colección vacía', () => {
    expect(computeCollectionStats([], catalog)).toMatchObject({ total: 0, decades: [], topArtists: [], oldest: undefined, numberOnes: 0 })
  })
})
