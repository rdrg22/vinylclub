import type { ReleaseType } from '@/types/music'
import type { CollectionTag, Decade, DiscoveryMode } from '@/types/shelf'

export interface FilterOption<T extends string = string> {
  value: T
  label: string
}

/**
 * `verifiable`: el filtro se resuelve con datos de MusicBrainz (tipos, fechas, etiquetas).
 * `editorial`: clasificación propia de Vinyl Club; no es un dato musical verificable.
 */
export type FilterNature = 'verifiable' | 'editorial'

export const RELEASE_TYPE_OPTIONS: FilterOption<ReleaseType>[] = [
  { value: 'album', label: 'Álbumes' },
  { value: 'single', label: 'Singles' },
  { value: 'ep', label: 'EP' },
  { value: 'compilation', label: 'Recopilatorios' },
  { value: 'soundtrack', label: 'Bandas sonoras' },
]

export const RELEASE_TYPE_LABEL: Record<ReleaseType | 'other', string> = {
  album: 'Álbum',
  single: 'Single',
  ep: 'EP',
  compilation: 'Recopilatorio',
  soundtrack: 'Banda sonora',
  other: 'Otro',
}

export const DECADE_OPTIONS: FilterOption<Decade>[] = [
  { value: '1950s', label: 'Años 50' },
  { value: '1960s', label: 'Años 60' },
  { value: '1970s', label: 'Años 70' },
  { value: '1980s', label: 'Años 80' },
  { value: '1990s', label: 'Años 90' },
  { value: '2000s', label: 'Años 2000' },
  { value: '2010s', label: 'Años 2010' },
  { value: '2020s', label: 'Años 2020' },
]

/** Los valores coinciden con etiquetas de MusicBrainz. */
export const GENRE_OPTIONS: FilterOption[] = [
  { value: 'rock', label: 'Rock' },
  { value: 'pop', label: 'Pop' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'electronic', label: 'Electrónica' },
  { value: 'hip hop', label: 'Hip-hop' },
  { value: 'soul', label: 'Soul' },
  { value: 'funk', label: 'Funk' },
  { value: 'folk', label: 'Folk' },
  { value: 'blues', label: 'Blues' },
  { value: 'reggae', label: 'Reggae' },
  { value: 'classical', label: 'Clásica' },
  { value: 'latin', label: 'Latina' },
]

export const STYLE_OPTIONS: FilterOption[] = [
  { value: 'punk', label: 'Punk' },
  { value: 'grunge', label: 'Grunge' },
  { value: 'techno', label: 'Techno' },
  { value: 'heavy metal', label: 'Heavy metal' },
  { value: 'indie', label: 'Indie' },
]

export const COLLECTION_OPTIONS: FilterOption<CollectionTag>[] = [
  { value: 'classics', label: 'Clásicos' },
  { value: 'cult', label: 'Discos de culto' },
  { value: 'essentials', label: 'Imprescindibles' },
  { value: 'rarities', label: 'Rarezas' },
]

export const DISCOVERY_OPTIONS: FilterOption<DiscoveryMode>[] = [
  { value: 'hidden-gems', label: 'Joyas ocultas' },
  { value: 'emerging', label: 'Artistas emergentes' },
  { value: 'random', label: 'Selección aleatoria' },
]

export const FILTER_NATURE = {
  releaseTypes: 'verifiable',
  decades: 'verifiable',
  artists: 'verifiable',
  genres: 'verifiable',
  styles: 'verifiable',
  collections: 'editorial',
  discovery: 'editorial',
} as const satisfies Record<string, FilterNature>
