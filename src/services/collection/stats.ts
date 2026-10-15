/**
 * Estadísticas de la colección para el perfil. Todo sale de los datos guardados de cada
 * edición (MusicBrainz) y, para los puestos en las listas, del catálogo de la tienda
 * (Billboard): nada se estima ni se inventa.
 */
import type { Album } from '@/types/music'
import { isVinyl, type CollectionItem } from './collection'

export interface CollectionStats {
  total: number
  formats: { vinyl: number; cd: number; other: number }
  /** Ediciones por década de publicación, de la más antigua a la más reciente. */
  decades: Array<{ decade: number; count: number }>
  /** Ediciones sin fecha conocida (no cuentan en `decades`). */
  undated: number
  /** Artistas con más de un disco, de más a menos (máx. 5). */
  topArtists: Array<{ artist: string; count: number }>
  oldest?: CollectionItem
  newest?: CollectionItem
  /** Discos (no ediciones) que fueron nº 1 / estuvieron en el Top 10 anual de Billboard. */
  numberOnes: number
  inCharts: number
}

const isCd = (formats: string[]) => formats.some((f) => /\bcd\b/i.test(f))

export function computeCollectionStats(items: CollectionItem[], catalog: ReadonlyMap<string, Album>): CollectionStats {
  const formats = { vinyl: 0, cd: 0, other: 0 }
  const decades = new Map<number, number>()
  const artists = new Map<string, { artist: string; count: number }>()
  let undated = 0
  const dated: CollectionItem[] = []

  for (const item of items) {
    if (isVinyl(item.formats)) formats.vinyl++
    else if (isCd(item.formats)) formats.cd++
    else formats.other++

    const year = item.date ? Number(item.date.slice(0, 4)) : NaN
    if (Number.isFinite(year)) {
      const decade = Math.floor(year / 10) * 10
      decades.set(decade, (decades.get(decade) ?? 0) + 1)
      dated.push(item)
    } else {
      undated++
    }

    const key = item.artist.trim().toLowerCase()
    const entry = artists.get(key) ?? { artist: item.artist.trim(), count: 0 }
    entry.count++
    artists.set(key, entry)
  }

  dated.sort((a, b) => a.date!.localeCompare(b.date!))

  // Un disco con varias ediciones en la colección cuenta una vez en las listas.
  const albumIds = new Set(items.map((i) => i.albumId))
  let numberOnes = 0
  let inCharts = 0
  for (const id of albumIds) {
    const charts = catalog.get(id)?.charts ?? []
    if (charts.length > 0) inCharts++
    if (charts.some((c) => c.rank === 1)) numberOnes++
  }

  return {
    total: items.length,
    formats,
    decades: [...decades].sort(([a], [b]) => a - b).map(([decade, count]) => ({ decade, count })),
    undated,
    topArtists: [...artists.values()]
      .filter((a) => a.count > 1)
      .sort((a, b) => b.count - a.count || a.artist.localeCompare(b.artist, 'es'))
      .slice(0, 5),
    oldest: dated[0],
    newest: dated.at(-1),
    numberOnes,
    inCharts,
  }
}
