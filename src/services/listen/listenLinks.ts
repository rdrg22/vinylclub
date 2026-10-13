/**
 * Enlaces para escuchar o comprar un disco.
 *
 * - Apple Music: enlace directo al álbum, verificado con la iTunes Search API
 *   (mismo criterio de artista + título que las demos de audio).
 * - Spotify, Tidal, SoundCloud y Amazon: no hay una API pública sin clave que dé
 *   el enlace exacto, así que se enlaza a la búsqueda del disco en cada servicio
 *   y la interfaz lo indica como búsqueda.
 */
import { fetchJson } from '@/services/http'
import { sameAlbum, sameArtist } from '@/services/previews/itunesPreviews'
import type { Album } from '@/types/music'
import { comparable } from '@/utils/text'

export type ListenService = 'apple' | 'spotify' | 'tidal' | 'soundcloud' | 'amazon'

export interface ListenLink {
  service: ListenService
  url: string
  /** `direct`: página del disco. `search`: búsqueda del disco en el servicio. */
  kind: 'direct' | 'search'
}

const enc = encodeURIComponent
const query = (album: Pick<Album, 'artist' | 'title'>) => `${album.artist} ${album.title}`

export function searchLinks(album: Pick<Album, 'artist' | 'title'>): Record<ListenService, ListenLink> {
  const q = query(album)
  return {
    apple: { service: 'apple', kind: 'search', url: `https://music.apple.com/us/search?term=${enc(q)}` },
    spotify: { service: 'spotify', kind: 'search', url: `https://open.spotify.com/search/${enc(q)}/albums` },
    tidal: { service: 'tidal', kind: 'search', url: `https://tidal.com/search/albums?q=${enc(q)}` },
    soundcloud: { service: 'soundcloud', kind: 'search', url: `https://soundcloud.com/search/albums?q=${enc(q)}` },
    // «popular» es el departamento CDs & Vinyl de amazon.com.
    amazon: { service: 'amazon', kind: 'search', url: `https://www.amazon.com/s?k=${enc(q)}&i=popular` },
  }
}

interface ItunesAlbum {
  wrapperType?: string
  artistName?: string
  collectionName?: string
  collectionViewUrl?: string
}

const appleCache = new Map<string, string | null>()

/** URL del álbum en Apple Music, o `null` si no hay uno que coincida con seguridad. */
export async function findAppleMusicAlbum(album: Pick<Album, 'artist' | 'title'>, signal?: AbortSignal): Promise<string | null> {
  const key = `${comparable(album.artist)}|${comparable(album.title)}`
  if (appleCache.has(key)) return appleCache.get(key) ?? null

  const params = new URLSearchParams({ term: query(album), media: 'music', entity: 'album', limit: '15', country: 'US' })
  const data = await fetchJson<{ results?: ItunesAlbum[] }>(`https://itunes.apple.com/search?${params}`, { signal })
  const match = (data.results ?? []).find(
    (r) =>
      r.collectionViewUrl &&
      r.artistName &&
      r.collectionName &&
      sameArtist(r.artistName, album.artist) &&
      sameAlbum(r.collectionName, album.title),
  )
  // Sin el parámetro de seguimiento `uo` que añade la API.
  const url = match?.collectionViewUrl ? match.collectionViewUrl.replace(/[?&]uo=\d+/, '') : null
  appleCache.set(key, url)
  return url
}

/** Todos los enlaces del disco: Apple Music directo si se encuentra, el resto como búsqueda. */
export async function getListenLinks(album: Pick<Album, 'artist' | 'title'>, signal?: AbortSignal): Promise<ListenLink[]> {
  const links = searchLinks(album)
  const apple = await findAppleMusicAlbum(album, signal).catch(() => null)
  if (apple) links.apple = { service: 'apple', kind: 'direct', url: apple }
  return [links.apple, links.spotify, links.tidal, links.soundcloud, links.amazon]
}
