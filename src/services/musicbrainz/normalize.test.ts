import { describe, expect, it } from 'vitest'
import { creditName, toAlbum, toAlbumDetails, toRelease, toReleaseType, topTags, yearOf } from './normalize'

describe('toReleaseType', () => {
  it('da prioridad a los tipos secundarios', () => {
    expect(toReleaseType('Album', ['Soundtrack'])).toBe('soundtrack')
    expect(toReleaseType('Album', ['Compilation'])).toBe('compilation')
  })
  it('traduce los primarios y deja «other» para el resto', () => {
    expect(toReleaseType('Album')).toBe('album')
    expect(toReleaseType('EP')).toBe('ep')
    expect(toReleaseType('Single')).toBe('single')
    expect(toReleaseType('Broadcast')).toBe('other')
    expect(toReleaseType(null)).toBe('other')
  })
})

describe('creditName', () => {
  it('une los créditos con sus frases de unión', () => {
    expect(
      creditName([
        { name: 'Simon', joinphrase: ' & ', artist: { id: '1', name: 'Paul Simon' } },
        { name: 'Garfunkel', artist: { id: '2', name: 'Art Garfunkel' } },
      ]),
    ).toBe('Simon & Garfunkel')
  })
  it('no inventa un nombre si no hay crédito', () => {
    expect(creditName(undefined)).toBe('Artista desconocido')
  })
})

describe('topTags', () => {
  it('descarta etiquetas sin votos y ordena por votos', () => {
    expect(
      topTags([
        { name: 'rock', count: 3 },
        { name: 'spam', count: 0 },
        { name: 'alternative rock', count: 27 },
        { name: 'downvoted', count: -1 },
      ]),
    ).toEqual(['alternative rock', 'rock'])
  })
})

describe('yearOf', () => {
  it('extrae el año de fechas parciales', () => {
    expect(yearOf('1997-05-21')).toBe(1997)
    expect(yearOf('1997')).toBe(1997)
    expect(yearOf('')).toBeUndefined()
    expect(yearOf(undefined)).toBeUndefined()
  })
})

describe('toAlbum', () => {
  it('normaliza un release group sin campos opcionales', () => {
    const album = toAlbum({ id: 'abc', title: 'Untitled' })
    expect(album).toMatchObject({ id: 'abc', source: 'musicbrainz', title: 'Untitled', artist: 'Artista desconocido' })
    expect(album.year).toBeUndefined()
    expect(album.firstReleaseDate).toBeUndefined()
  })
})

describe('toRelease', () => {
  it('quita formatos y sellos duplicados y enlaza con su disco', () => {
    const release = toRelease({
      id: 'r1',
      title: 'Kind of Blue',
      media: [{ format: 'CD' }, { format: 'CD' }, { format: null }],
      'label-info': [{ label: { name: 'Columbia' } }, { label: { name: 'Columbia' } }, { label: null }],
      'release-group': { id: 'rg1', title: 'Kind of Blue', 'primary-type': 'Album' },
    })
    expect(release.formats).toEqual(['CD'])
    expect(release.labels).toEqual(['Columbia'])
    expect(release.album.id).toBe('rg1')
  })
})

describe('toAlbumDetails', () => {
  it('ordena ediciones por fecha, deja las que no tienen al final y marca el recorte de 25', () => {
    const releases = Array.from({ length: 25 }, (_, i) => ({ id: `r${i}`, date: `20${String(i).padStart(2, '0')}` }))
    releases[0] = { id: 'nodate', date: '' }
    const details = toAlbumDetails({ id: 'rg', releases })
    expect(details.releases.at(-1)?.id).toBe('nodate')
    expect(details.releases[0]?.date).toBe('2001')
    expect(details.releasesTruncated).toBe(true)
  })
})
