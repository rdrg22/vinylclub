/** Estado de las consultas a MusicBrainz para los componentes. */
import {
  getArtistDiscography,
  getAlbumDetails,
  getArtist,
  searchAlbums,
  searchArtists,
  searchReleases,
  searchShelfAlbums,
} from '@/services/musicbrainz/musicbrainz'
import type { ShelfFilters } from '@/types/shelf'
import { useAsyncResource } from './useAsyncResource'

export function useAlbumSearch(text: string, page: number) {
  const q = text.trim()
  return useAsyncResource(q ? `albums|${q}|${page}` : null, (signal) => searchAlbums(q, page, signal))
}

export function useArtistSearch(text: string, page: number) {
  const q = text.trim()
  return useAsyncResource(q ? `artists|${q}|${page}` : null, (signal) => searchArtists(q, page, signal))
}

export function useReleaseSearch(text: string, page: number) {
  const q = text.trim()
  return useAsyncResource(q ? `releases|${q}|${page}` : null, (signal) => searchReleases(q, page, signal))
}

/** Metadatos ampliados de un disco de MusicBrainz; `null` no consulta nada. */
export function useAlbumDetails(albumId: string | null) {
  return useAsyncResource(albumId ? `album|${albumId}` : null, (signal) => getAlbumDetails(albumId!, signal))
}

export function useArtist(artistId: string | undefined) {
  return useAsyncResource(artistId ? `artist|${artistId}` : null, (signal) => getArtist(artistId!, signal))
}

export function useArtistAlbums(artistId: string | undefined, page: number) {
  return useAsyncResource(artistId ? `artist-albums|${artistId}|${page}` : null, (signal) =>
    getArtistDiscography(artistId!, page, signal),
  )
}

/** Discos de MusicBrainz para unos filtros de estantería (configurador y estanterías reales). */
export function useShelfSearch(filters: ShelfFilters | null, page = 1) {
  const key = filters ? `shelf|${JSON.stringify(filters)}|${page}` : null
  return useAsyncResource(key, (signal) => searchShelfAlbums(filters!, page, signal))
}
