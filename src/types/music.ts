/**
 * Modelo musical común de la app. Los componentes dependen solo de estos tipos,
 * nunca de la forma original de las respuestas de MusicBrainz.
 */

/** Tipos primarios de lanzamiento que la tienda sabe filtrar. */
export type ReleaseType = 'album' | 'single' | 'ep' | 'compilation' | 'soundtrack'

/**
 * Origen de un disco. `demo` identifica datos de ejemplo escritos a mano:
 * nunca deben presentarse como resultados de MusicBrainz.
 */
export type DataSource = 'musicbrainz' | 'demo'

export interface ArtistRef {
  /** MBID del artista. */
  id: string
  name: string
}

/** Un disco = un «release group» de MusicBrainz (la obra, no una edición concreta). */
export interface Album {
  /** MBID del release group en MusicBrainz, o `demo-*` para datos de ejemplo. */
  id: string
  source: DataSource
  title: string
  /** Crédito tal como se muestra («Simon & Garfunkel», «Daft Punk feat. …»). */
  artist: string
  artists?: ArtistRef[]
  /** Fecha de primera publicación tal como la da la fuente (YYYY, YYYY-MM o YYYY-MM-DD). */
  firstReleaseDate?: string
  year?: number
  releaseType?: ReleaseType | 'other'
  /** Tipos de MusicBrainz sin traducir: primario y secundarios («Album», «Live»…). */
  primaryType?: string
  secondaryTypes?: string[]
  disambiguation?: string
  /** Número de ediciones en MusicBrainz (solo lo dan las búsquedas, no las consultas por MBID). */
  releaseCount?: number
  /** Etiquetas de la comunidad de MusicBrainz, ordenadas por votos. No son géneros verificados. */
  tags?: string[]
}

/** Una edición concreta de un disco (país, fecha, formato, sello). */
export interface Release {
  id: string
  title: string
  artist: string
  /** Disco al que pertenece la edición. */
  album: Album
  date?: string
  country?: string
  status?: string
  formats: string[]
  trackCount?: number
  labels: string[]
  barcode?: string
}

export interface Artist {
  id: string
  name: string
  sortName?: string
  /** Person, Group, Orchestra… */
  type?: string
  country?: string
  area?: string
  disambiguation?: string
  begin?: string
  end?: string
  tags?: string[]
}

/** Metadatos ampliados de un disco, obtenidos al abrir su ficha. */
export interface AlbumDetails {
  album: Album
  /** Géneros oficiales de MusicBrainz (votados y moderados), si existen. */
  genres: string[]
  /** Ediciones devueltas por MusicBrainz, ordenadas por fecha (la consulta devuelve como máximo 25). */
  releases: Array<Pick<Release, 'id' | 'title' | 'date' | 'country' | 'status'>>
  /** `true` si MusicBrainz ha recortado la lista de ediciones. */
  releasesTruncated: boolean
}

/** Página de resultados con los datos necesarios para paginar. */
export interface Page<T> {
  items: T[]
  total: number
  offset: number
  limit: number
}

/** Fragmento de audio de una pista del disco, obtenido de un proveedor externo. */
export interface AlbumPreview {
  trackName: string
  previewUrl: string
  /** Página de la pista en la tienda del proveedor (atribución). */
  storeUrl?: string
  provider: 'itunes'
}
