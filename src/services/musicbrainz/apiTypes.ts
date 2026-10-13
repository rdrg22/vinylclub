/**
 * Forma (parcial) de las respuestas JSON de MusicBrainz. Solo se usa dentro de
 * services/musicbrainz: el resto de la app trabaja con los tipos de `@/types/music`.
 * Todo es opcional porque la API omite los campos que no tiene.
 */

export interface MbTag {
  name: string
  count?: number
}

export interface MbArtistCredit {
  name?: string
  joinphrase?: string
  artist?: { id: string; name: string }
}

export interface MbReleaseGroup {
  id: string
  title?: string
  'primary-type'?: string | null
  'secondary-types'?: string[]
  'first-release-date'?: string
  disambiguation?: string
  /** Número de ediciones (solo en resultados de búsqueda). */
  count?: number
  'artist-credit'?: MbArtistCredit[]
  tags?: MbTag[]
  genres?: MbTag[]
  releases?: MbRelease[]
}

export interface MbRelease {
  id: string
  title?: string
  status?: string | null
  date?: string
  country?: string | null
  barcode?: string | null
  'track-count'?: number
  'artist-credit'?: MbArtistCredit[]
  'release-group'?: MbReleaseGroup
  media?: Array<{ format?: string | null }>
  'label-info'?: Array<{ label?: { name?: string } | null }>
}

export interface MbArtist {
  id: string
  name?: string
  'sort-name'?: string
  type?: string | null
  country?: string | null
  area?: { name?: string } | null
  disambiguation?: string
  'life-span'?: { begin?: string | null; end?: string | null }
  tags?: MbTag[]
}

export interface MbSearchResponse {
  count?: number
  offset?: number
  'release-groups'?: MbReleaseGroup[]
  'release-group-count'?: number
  'release-group-offset'?: number
  releases?: MbRelease[]
  artists?: MbArtist[]
}
