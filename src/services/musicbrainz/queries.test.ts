import { describe, expect, it } from 'vitest'
import type { ShelfFilters } from '@/types/shelf'
import { albumTextQuery, escapeTerms, quote } from './lucene'
import { buildShelfQuery } from './shelfQuery'

const EMPTY: ShelfFilters = {
  releaseTypes: [],
  decades: [],
  artists: [],
  genres: [],
  styles: [],
  collections: [],
  discovery: null,
}

describe('lucene', () => {
  it('escapa la sintaxis especial del texto del usuario', () => {
    expect(escapeTerms('AC/DC: Back in Black!')).toBe('AC\\/DC\\: Back in Black\\!')
  })
  it('neutraliza operadores escritos por el usuario', () => {
    expect(escapeTerms('Black AND White')).toBe('Black and White')
  })
  it('escapa comillas dentro de una frase', () => {
    expect(quote('12" Mixes')).toBe('"12\\" Mixes"')
  })
  it('construye la consulta de discos con prioridad a artista y título', () => {
    expect(albumTextQuery('ok computer')).toBe(
      '+(artistname:"ok computer"^4 OR releasegroup:"ok computer"^3 OR ok computer) primarytype:album^2 status:official^2',
    )
  })
})

describe('buildShelfQuery', () => {
  it('sin filtros verificables no genera consulta', () => {
    expect(buildShelfQuery(EMPTY).query).toBeNull()
  })

  it('combina tipos, décadas y etiquetas', () => {
    const result = buildShelfQuery({
      ...EMPTY,
      releaseTypes: ['album', 'soundtrack'],
      decades: ['1990s'],
      genres: ['rock'],
      styles: ['grunge', 'indie'],
    })
    expect(result.query).toBe(
      '((primarytype:album AND NOT secondarytype:*) OR secondarytype:soundtrack) AND firstreleasedate:[1990 TO 2000} AND tag:"rock" AND (tag:"grunge" OR tag:"indie")',
    )
    expect(result.applied).toEqual(['Álbumes', 'Bandas sonoras', 'Años 90', 'Rock', 'Grunge', 'Indie'])
    expect(result.notApplied).toEqual([])
  })

  it('filtra por artista con su MBID', () => {
    const result = buildShelfQuery({ ...EMPTY, artists: [{ id: 'a74b1b7f-71a5-4011-9441-d0b5e4122711', name: 'Radiohead' }] })
    expect(result.query).toBe('arid:a74b1b7f-71a5-4011-9441-d0b5e4122711')
    expect(result.applied).toEqual(['Radiohead'])
  })

  it('no presenta como aplicados los filtros editoriales', () => {
    const result = buildShelfQuery({ ...EMPTY, decades: ['1970s'], collections: ['cult'], discovery: 'hidden-gems' })
    expect(result.applied).toEqual(['Años 70'])
    expect(result.notApplied.map((f) => f.label)).toEqual(['Discos de culto', 'Joyas ocultas'])
  })

  it('la selección aleatoria sí se aplica (eligiendo página al azar)', () => {
    const result = buildShelfQuery({ ...EMPTY, genres: ['jazz'], discovery: 'random' })
    expect(result.randomize).toBe(true)
    expect(result.applied).toContain('Selección aleatoria')
  })
})
