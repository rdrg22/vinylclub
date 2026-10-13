import type { ArtistRef, ReleaseType } from './music'

export type Decade = '1960s' | '1970s' | '1980s' | '1990s' | '2000s' | '2010s' | '2020s'

/** Clasificaciones editoriales propias de Vinyl Club (no proceden de MusicBrainz). */
export type CollectionTag = 'classics' | 'cult' | 'essentials' | 'rarities'

export type DiscoveryMode = 'hidden-gems' | 'emerging' | 'random'

export interface ShelfFilters {
  releaseTypes: ReleaseType[]
  decades: Decade[]
  /** Artistas concretos (MBID + nombre para mostrarlo sin volver a consultar). */
  artists: ArtistRef[]
  genres: string[]
  styles: string[]
  collections: CollectionTag[]
  discovery: DiscoveryMode | null
}

export interface Shelf {
  id: string
  name: string
  filters: ShelfFilters
  /** Orden de visualización en la tienda (0 = primera). */
  position: number
  /** ISO 8601. */
  createdAt: string
}
