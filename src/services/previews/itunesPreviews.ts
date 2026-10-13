/**
 * Demos de audio de 30 s mediante la iTunes Search API (pública, sin clave).
 * https://performance-partners.apple.com/search-api
 *
 * - Solo se consulta bajo demanda (al pulsar «escuchar»), nunca al desplazarse.
 * - Solo se acepta una pista si artista y álbum coinciden: nunca se reproduce otro disco.
 * - Los resultados, también los negativos, se guardan en caché durante la sesión.
 */
import type { Album, AlbumPreview } from '@/types/music'
import { fetchJson } from '@/services/http'
import { comparable } from '@/utils/text'

const ENDPOINT = 'https://itunes.apple.com/search'
const COUNTRY = 'ES'

interface ItunesTrack {
  kind?: string
  artistName?: string
  collectionName?: string
  trackName?: string
  previewUrl?: string
  trackViewUrl?: string
}

interface ItunesSearchResponse {
  resultCount: number
  results: ItunesTrack[]
}

const cache = new Map<string, AlbumPreview | null>()
const inFlight = new Map<string, Promise<AlbumPreview | null>>()

const sameArtist = (a: string, b: string) => {
  const x = comparable(a)
  const y = comparable(b)
  return x.length > 0 && y.length > 0 && (x === y || x.startsWith(y) || y.startsWith(x))
}

const sameAlbum = (a: string, b: string) => {
  const x = comparable(a)
  const y = comparable(b)
  return x.length > 0 && x === y
}

export function matchPreview(album: Pick<Album, 'title' | 'artist'>, tracks: ItunesTrack[]): AlbumPreview | null {
  const track = tracks.find(
    (t) =>
      t.kind === 'song' &&
      t.previewUrl &&
      t.trackName &&
      t.artistName &&
      t.collectionName &&
      sameArtist(t.artistName, album.artist) &&
      sameAlbum(t.collectionName, album.title),
  )
  if (!track?.previewUrl || !track.trackName) return null
  return {
    trackName: track.trackName,
    previewUrl: track.previewUrl,
    storeUrl: track.trackViewUrl,
    provider: 'itunes',
  }
}

async function search(album: Album): Promise<AlbumPreview | null> {
  const params = new URLSearchParams({
    term: `${album.artist} ${album.title}`,
    media: 'music',
    entity: 'song',
    limit: '25',
    country: COUNTRY,
  })
  const data = await fetchJson<ItunesSearchResponse>(`${ENDPOINT}?${params}`)
  return matchPreview(album, data.results ?? [])
}

/** Devuelve la demo del disco o `null` si no hay una pista que coincida con seguridad. */
export function findAlbumPreview(album: Album): Promise<AlbumPreview | null> {
  const key = `${comparable(album.artist)}|${comparable(album.title)}`
  if (cache.has(key)) return Promise.resolve(cache.get(key) ?? null)

  let pending = inFlight.get(key)
  if (!pending) {
    pending = search(album)
      .then((preview) => {
        cache.set(key, preview)
        return preview
      })
      .finally(() => inFlight.delete(key))
    inFlight.set(key, pending)
  }
  return pending
}
