/**
 * Datos para la parte de atrás de un disco:
 * - la contraportada original si Cover Art Archive la tiene;
 * - la lista de canciones, sello y fecha de la edición que usa Cover Art Archive
 *   (o, si no hay portada, la edición más antigua conocida), desde MusicBrainz.
 * Nada se inventa: si un dato no existe, no se muestra.
 */
import { fetchJson, HttpError } from '@/services/http'
import { mbGet } from '@/services/musicbrainz/client'
import { getAlbumDetails } from '@/services/musicbrainz/musicbrainz'
import type { Album } from '@/types/music'

export interface BackTrack {
  /** Posición tal como figura en la edición («1», «A1», «B3»…). */
  number: string
  title: string
  /** Duración en milisegundos, si se conoce. */
  length?: number
}

export interface AlbumBack {
  /** Contraportada real (Cover Art Archive), si existe. */
  backImage?: string
  releaseId?: string
  releaseTitle?: string
  date?: string
  country?: string
  format?: string
  labels: string[]
  catalogNumbers: string[]
  tracks: BackTrack[]
}

interface CaaImage {
  types?: string[]
  image?: string
  thumbnails?: Record<string, string | undefined>
}
interface CaaResponse {
  release?: string
  images?: CaaImage[]
}
interface MbReleaseLookup {
  title?: string
  date?: string
  country?: string | null
  'label-info'?: Array<{ 'catalog-number'?: string | null; label?: { name?: string } | null }>
  media?: Array<{ format?: string | null; tracks?: Array<{ number?: string; title?: string; length?: number | null }> }>
}

/** Cover Art Archive devuelve algunas URL en http://: se fuerzan a https. */
const https = (url: string | undefined) => url?.replace(/^http:\/\//, 'https://')

const cache = new Map<string, AlbumBack>()

async function coverArtRelease(albumId: string, signal?: AbortSignal) {
  try {
    const data = await fetchJson<CaaResponse>(`https://coverartarchive.org/release-group/${albumId}`, { signal })
    const back = data.images?.find((image) => image.types?.includes('Back'))
    return {
      releaseId: data.release?.split('/').pop(),
      backImage: https(back?.thumbnails?.['500'] ?? back?.thumbnails?.large ?? back?.image),
    }
  } catch (error) {
    // 404: el disco no tiene imágenes en Cover Art Archive. Cualquier otro error se propaga.
    if (error instanceof HttpError && error.status === 404) return {}
    throw error
  }
}

export async function getAlbumBack(album: Album, signal?: AbortSignal): Promise<AlbumBack | null> {
  if (album.source !== 'musicbrainz') return null
  const cached = cache.get(album.id)
  if (cached) return cached

  const art = await coverArtRelease(album.id, signal)
  let releaseId = art.releaseId
  if (!releaseId) {
    const details = await getAlbumDetails(album.id, signal)
    releaseId = details.releases.find((r) => r.status === 'Official')?.id ?? details.releases[0]?.id
  }

  const back: AlbumBack = { backImage: art.backImage, releaseId, labels: [], catalogNumbers: [], tracks: [] }
  if (releaseId) {
    const release = await mbGet<MbReleaseLookup>(`release/${releaseId}`, { inc: 'recordings+labels' }, signal)
    const labelInfo = release['label-info'] ?? []
    back.releaseTitle = release.title
    back.date = release.date || undefined
    back.country = release.country ?? undefined
    back.format = [...new Set((release.media ?? []).map((m) => m.format).filter(Boolean))].join(' + ') || undefined
    back.labels = [...new Set(labelInfo.map((l) => l.label?.name).filter((n): n is string => !!n))]
    back.catalogNumbers = [...new Set(labelInfo.map((l) => l['catalog-number']).filter((n): n is string => !!n && n !== '[none]'))]
    back.tracks = (release.media ?? []).flatMap((medium) =>
      (medium.tracks ?? []).map((t) => ({ number: t.number ?? '', title: t.title ?? '', length: t.length ?? undefined })),
    )
  }
  cache.set(album.id, back)
  return back
}

export function formatLength(ms: number | undefined): string {
  if (!ms) return ''
  const seconds = Math.round(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
