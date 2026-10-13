/**
 * Traduce los filtros de una estantería a una consulta de búsqueda de MusicBrainz
 * (sintaxis Lucene, https://musicbrainz.org/doc/MusicBrainz_API/Search#Release_Group).
 *
 * Solo se traducen los filtros que MusicBrainz puede resolver con sus datos.
 * El resto se devuelve en `notApplied` con el motivo, para que la interfaz no
 * los presente como verificados.
 */
import {
  COLLECTION_OPTIONS,
  DECADE_OPTIONS,
  DISCOVERY_OPTIONS,
  GENRE_OPTIONS,
  RELEASE_TYPE_OPTIONS,
  STYLE_OPTIONS,
  type FilterOption,
} from '@/config/shelfFilters'
import type { ReleaseType } from '@/types/music'
import type { Decade, ShelfFilters } from '@/types/shelf'
import { quote } from './lucene'

export interface NotAppliedFilter {
  label: string
  reason: string
}

export interface ShelfQuery {
  /** `null` si no hay ningún filtro que MusicBrainz pueda aplicar. */
  query: string | null
  applied: string[]
  notApplied: NotAppliedFilter[]
  /** El modo «Selección aleatoria» se resuelve eligiendo una página al azar. */
  randomize: boolean
}

const RELEASE_TYPE_CLAUSE: Record<ReleaseType, string> = {
  // «Álbumes» = álbumes sin tipo secundario (excluye directos, recopilatorios, bandas sonoras…).
  album: '(primarytype:album AND NOT secondarytype:*)',
  single: 'primarytype:single',
  ep: 'primarytype:ep',
  compilation: 'secondarytype:compilation',
  soundtrack: 'secondarytype:soundtrack',
}

/** Rango semiabierto: «1990» ≤ fecha < «2000» también cubre «1999-12-31». */
const decadeClause = (decade: Decade) => {
  const start = Number.parseInt(decade, 10)
  return `firstreleasedate:[${start} TO ${start + 10}}`
}

const anyOf = (clauses: string[]) => (clauses.length === 1 ? clauses[0]! : `(${clauses.join(' OR ')})`)

const label = <T extends string>(options: FilterOption<T>[], value: T) =>
  options.find((option) => option.value === value)?.label ?? value

export function buildShelfQuery(filters: ShelfFilters): ShelfQuery {
  const clauses: string[] = []
  const applied: string[] = []
  const notApplied: NotAppliedFilter[] = []

  if (filters.releaseTypes.length) {
    clauses.push(anyOf(filters.releaseTypes.map((type) => RELEASE_TYPE_CLAUSE[type])))
    applied.push(...filters.releaseTypes.map((t) => label(RELEASE_TYPE_OPTIONS, t)))
  }
  if (filters.decades.length) {
    clauses.push(anyOf(filters.decades.map(decadeClause)))
    applied.push(...filters.decades.map((d) => label(DECADE_OPTIONS, d)))
  }
  if (filters.artists.length) {
    clauses.push(anyOf(filters.artists.map((artist) => `arid:${artist.id}`)))
    applied.push(...filters.artists.map((artist) => artist.name))
  }
  // Géneros y estilos son etiquetas de la comunidad: dentro de cada grupo basta
  // con una; entre grupos, el estilo afina el género («rock» + «grunge»).
  if (filters.genres.length) {
    clauses.push(anyOf(filters.genres.map((tag) => `tag:${quote(tag)}`)))
    applied.push(...filters.genres.map((g) => label(GENRE_OPTIONS, g)))
  }
  if (filters.styles.length) {
    clauses.push(anyOf(filters.styles.map((tag) => `tag:${quote(tag)}`)))
    applied.push(...filters.styles.map((s) => label(STYLE_OPTIONS, s)))
  }

  for (const collection of filters.collections) {
    notApplied.push({
      label: label(COLLECTION_OPTIONS, collection),
      reason: 'Es una clasificación editorial de Vinyl Club; MusicBrainz no la contiene.',
    })
  }

  let randomize = false
  if (filters.discovery === 'random') {
    randomize = true
    applied.push(label(DISCOVERY_OPTIONS, 'random'))
  } else if (filters.discovery) {
    notApplied.push({
      label: label(DISCOVERY_OPTIONS, filters.discovery),
      reason: 'MusicBrainz no ofrece datos de popularidad ni de trayectoria con los que calcularlo.',
    })
  }

  return { query: clauses.length ? clauses.join(' AND ') : null, applied, notApplied, randomize }
}
