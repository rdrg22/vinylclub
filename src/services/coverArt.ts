/**
 * Portadas del Cover Art Archive (https://musicbrainz.org/doc/Cover_Art_Archive/API).
 *
 * La URL se construye con el endpoint documentado y el MBID real del release group;
 * que exista portada no se da por hecho: si la imagen responde 404, AlbumCover
 * muestra el placeholder y el MBID se recuerda para no volver a pedirla.
 */
import type { Album } from '@/types/music'

const BASE_URL = 'https://coverartarchive.org/release-group'

/** Tamaños de miniatura que ofrece el archivo. */
export type CoverSize = 250 | 500 | 1200

const missing = new Set<string>()

/** URL candidata de la portada, o `undefined` si el disco no es de MusicBrainz o ya sabemos que no tiene. */
export function coverUrlFor(album: Pick<Album, 'id' | 'source'>, size: CoverSize = 250): string | undefined {
  if (album.source !== 'musicbrainz' || missing.has(album.id)) return undefined
  return `${BASE_URL}/${album.id}/front-${size}`
}

export function markCoverMissing(albumId: string) {
  missing.add(albumId)
}
