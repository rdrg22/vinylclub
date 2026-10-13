/** Traducción de respuestas de MusicBrainz al modelo común de la app. */
import type { Album, AlbumDetails, Artist, ArtistRef, Release, ReleaseType } from '@/types/music'
import type { MbArtist, MbArtistCredit, MbRelease, MbReleaseGroup, MbTag } from './apiTypes'

const MAX_TAGS = 6
/** Límite de entidades relacionadas que devuelve una consulta por MBID con `inc=`. */
const LOOKUP_INC_LIMIT = 25

/** Etiquetas de la comunidad: se descartan las que no tienen votos positivos y se ordenan por votos. */
export function topTags(tags: MbTag[] | undefined, max = MAX_TAGS): string[] {
  return (tags ?? [])
    .filter((tag) => (tag.count ?? 0) > 0 && tag.name.trim())
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, max)
    .map((tag) => tag.name)
}

export function creditName(credit: MbArtistCredit[] | undefined): string {
  if (!credit?.length) return 'Artista desconocido'
  return credit.map((part) => `${part.name ?? part.artist?.name ?? ''}${part.joinphrase ?? ''}`).join('').trim()
}

function creditArtists(credit: MbArtistCredit[] | undefined): ArtistRef[] {
  return (credit ?? []).flatMap((part) => (part.artist ? [{ id: part.artist.id, name: part.artist.name }] : []))
}

/** Los tipos secundarios mandan: un «Album + Soundtrack» es una banda sonora. */
export function toReleaseType(primary?: string | null, secondary: string[] = []): ReleaseType | 'other' {
  if (secondary.includes('Soundtrack')) return 'soundtrack'
  if (secondary.includes('Compilation')) return 'compilation'
  switch (primary) {
    case 'Album':
      return 'album'
    case 'Single':
      return 'single'
    case 'EP':
      return 'ep'
    default:
      return 'other'
  }
}

export function yearOf(date: string | undefined | null): number | undefined {
  const year = date ? Number.parseInt(date.slice(0, 4), 10) : NaN
  return Number.isFinite(year) ? year : undefined
}

export function toAlbum(group: MbReleaseGroup, fallbackCredit?: MbArtistCredit[]): Album {
  const credit = group['artist-credit'] ?? fallbackCredit
  const secondaryTypes = group['secondary-types'] ?? []
  const firstReleaseDate = group['first-release-date'] || undefined
  return {
    id: group.id,
    source: 'musicbrainz',
    title: group.title ?? 'Sin título',
    artist: creditName(credit),
    artists: creditArtists(credit),
    firstReleaseDate,
    year: yearOf(firstReleaseDate),
    releaseType: toReleaseType(group['primary-type'], secondaryTypes),
    primaryType: group['primary-type'] ?? undefined,
    secondaryTypes,
    disambiguation: group.disambiguation || undefined,
    releaseCount: group.count,
    tags: topTags(group.tags),
  }
}

export function toRelease(release: MbRelease): Release {
  const group = release['release-group'] ?? { id: release.id }
  const formats = [...new Set((release.media ?? []).map((m) => m.format).filter((f): f is string => !!f))]
  const labels = [
    ...new Set((release['label-info'] ?? []).map((l) => l.label?.name).filter((n): n is string => !!n)),
  ]
  return {
    id: release.id,
    title: release.title ?? 'Sin título',
    artist: creditName(release['artist-credit']),
    album: toAlbum(group, release['artist-credit']),
    date: release.date || undefined,
    country: release.country ?? undefined,
    status: release.status ?? undefined,
    formats,
    trackCount: release['track-count'],
    labels,
    barcode: release.barcode || undefined,
  }
}

export function toArtist(artist: MbArtist): Artist {
  return {
    id: artist.id,
    name: artist.name ?? 'Artista sin nombre',
    sortName: artist['sort-name'],
    type: artist.type ?? undefined,
    country: artist.country ?? undefined,
    area: artist.area?.name,
    disambiguation: artist.disambiguation || undefined,
    begin: artist['life-span']?.begin ?? undefined,
    end: artist['life-span']?.end ?? undefined,
    tags: topTags(artist.tags, 4),
  }
}

export function toAlbumDetails(group: MbReleaseGroup): AlbumDetails {
  const releases = (group.releases ?? [])
    .map((r) => ({
      id: r.id,
      title: r.title ?? 'Sin título',
      date: r.date || undefined,
      country: r.country ?? undefined,
      status: r.status ?? undefined,
    }))
    // Sin fecha al final; el resto, de la más antigua a la más reciente.
    .sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'))
  return {
    album: toAlbum(group),
    genres: topTags(group.genres, 8),
    releases,
    releasesTruncated: releases.length >= LOOKUP_INC_LIMIT,
  }
}

/** Elimina duplicados por id conservando el primer elemento (el de mayor puntuación). */
export function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)))
}
