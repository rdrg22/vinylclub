/**
 * Catálogo de la tienda: los 10 álbumes más vendidos de cada año en EE. UU.
 * según las listas anuales de Billboard, identificados en MusicBrainz.
 *
 * Se genera con `scripts/fetch-billboard-charts.mjs` + `scripts/resolve-chart-albums.mjs`;
 * la app no hace ninguna petición para montarlo, solo para las portadas.
 */
import { toReleaseType, yearOf } from '@/services/musicbrainz/normalize'
import type { Album, ArtistRef, ChartPosition } from '@/types/music'
import type { Decade } from '@/types/shelf'
import raw from './billboardTop10.json'

export interface ChartEntryFile {
  year: number
  rank: number
  chartTitle: string
  chartArtist: string
  album: {
    id: string
    title: string
    artist: string
    artists: ArtistRef[]
    firstReleaseDate?: string
    primaryType?: string
    secondaryTypes?: string[]
  } | null
}

export interface ChartCatalogFile {
  source: string
  sourceUrlPattern: string
  /** Años que no publica la fuente principal y se completan con otra (p. ej., solo el nº 1 desde Wikipedia). */
  yearSources?: Record<string, { source: string; url: string }>

  generatedAt: string
  entries: ChartEntryFile[]
}

/** Las listas publican en mayúsculas: «BORN IN THE U.S.A.» → «Born In The U.S.A.». */
export function titleCase(text: string): string {
  return text.toLowerCase().replace(/(^|[\s(/".-])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toUpperCase())
}

function toAlbum(entry: ChartEntryFile): Album {
  const position: ChartPosition = { year: entry.year, rank: entry.rank }
  if (!entry.album) {
    return {
      id: `chart-${entry.year}-${entry.rank}`,
      source: 'chart',
      title: titleCase(entry.chartTitle),
      artist: titleCase(entry.chartArtist),
      charts: [position],
    }
  }
  const { album } = entry
  return {
    id: album.id,
    source: 'musicbrainz',
    title: album.title,
    artist: album.artist,
    artists: album.artists,
    firstReleaseDate: album.firstReleaseDate,
    year: yearOf(album.firstReleaseDate),
    primaryType: album.primaryType,
    secondaryTypes: album.secondaryTypes ?? [],
    releaseType: toReleaseType(album.primaryType, album.secondaryTypes),
    charts: [position],
  }
}

/**
 * Un disco que estuvo en la lista varios años aparece una sola vez, con todos
 * sus puestos; se coloca en el primer año en que entró.
 */
export function buildCatalog(entries: ChartEntryFile[]): Album[] {
  const byId = new Map<string, Album>()
  const sorted = [...entries].sort((a, b) => a.year - b.year || a.rank - b.rank)
  for (const entry of sorted) {
    const album = toAlbum(entry)
    const existing = byId.get(album.id)
    if (existing) existing.charts = [...(existing.charts ?? []), ...(album.charts ?? [])]
    else byId.set(album.id, album)
  }
  return [...byId.values()]
}

const file = raw as ChartCatalogFile

export const CHART_SOURCE = file.source
export const chartSourceUrl = (year: number) =>
  file.yearSources?.[year]?.url ?? file.sourceUrlPattern.replace('{year}', String(year))
/** Nombre de la fuente de un año concreto, si no es la principal. */
export const chartYearSource = (year: number) => file.yearSources?.[year]?.source
export const CHART_ALBUMS: Album[] = buildCatalog(file.entries)

export const firstChartYear = (album: Album) => album.charts?.[0]?.year ?? 0
export const bestRank = (album: Album) => Math.min(...(album.charts ?? []).map((c) => c.rank), 99)

export const decadeOf = (year: number): Decade => `${Math.floor(year / 10) * 10}s` as Decade

/** Años cubiertos por el catálogo dentro de una década. */
export function yearsInDecade(decade: Decade): number[] {
  return [...new Set(CHART_ALBUMS.map(firstChartYear).filter((y) => decadeOf(y) === decade))].sort((a, b) => a - b)
}
