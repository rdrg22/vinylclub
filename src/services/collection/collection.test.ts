import { describe, expect, it } from 'vitest'
import type { Release } from '@/types/music'
import { albumOf, fromDoc, isVinyl, itemFromRelease, localCollection, toDocData } from './collection'

const release: Release = {
  id: '11111111-1111-1111-1111-111111111111',
  title: 'Thriller',
  artist: 'Michael Jackson',
  album: { id: '22222222-2222-2222-2222-222222222222', source: 'musicbrainz', title: 'Thriller', artist: 'Michael Jackson' },
  date: '1982-11-30',
  country: 'US',
  formats: ['12" Vinyl'],
  labels: ['Epic'],
  barcode: '074643811216',
}

function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  }
}

describe('colección', () => {
  it('guarda los datos de la edición y su disco', () => {
    const item = itemFromRelease(release)
    expect(item).toMatchObject({ releaseId: release.id, albumId: release.album.id, date: '1982-11-30', barcode: '074643811216' })
    expect(albumOf({ ...item, id: 'x', addedAt: '' })).toMatchObject({ id: release.album.id, source: 'musicbrainz', year: 1982 })
  })

  it('descarta fechas y códigos con formato inesperado', () => {
    const item = itemFromRelease({ ...release, date: '1982-??', barcode: 'none' })
    expect(item.date).toBeUndefined()
    expect(item.barcode).toBeUndefined()
  })

  it('prepara documentos de Firestore sin campos vacíos', () => {
    const data = toDocData({ ...release, country: undefined, barcode: undefined })
    expect(data).not.toHaveProperty('country')
    expect(data).not.toHaveProperty('barcode')
    expect(data).toMatchObject({ releaseId: release.id, date: '1982-11-30' })
    const item = fromDoc('r1', { ...data, addedAt: { toDate: () => new Date('2026-10-15T10:00:00Z') } })
    expect(item).toMatchObject({ id: 'r1', addedAt: '2026-10-15T10:00:00.000Z', country: undefined })
  })

  it('reconoce vinilos', () => {
    expect(isVinyl(['12" Vinyl'])).toBe(true)
    expect(isVinyl(['CD'])).toBe(false)
  })

  it('almacén local: añade, evita duplicados y quita', async () => {
    const store = localCollection(memoryStorage())
    const added = await store.add(release)
    expect(await store.list()).toHaveLength(1)
    await expect(store.add(release)).rejects.toMatchObject({ code: 'duplicate' })
    await store.remove(added.id)
    expect(await store.list()).toEqual([])
  })
})
