import { DECADE_OPTIONS } from '@/config/shelfFilters'
import { CHART_ALBUMS, decadeOf, firstChartYear } from '@/data/charts/chartCatalog'
import type { Album } from '@/types/music'
import type { Decade, Shelf } from '@/types/shelf'

/*
 * Estanterías de la tienda: una por década, con los Top 10 anuales de Billboard.
 * Son fijas y se calculan una vez al cargar el módulo (no hacen peticiones).
 * Las estanterías personalizadas del usuario se sumarán aquí en las fases 3 y 4.
 */

const EMPTY_FILTERS: Shelf['filters'] = {
  releaseTypes: [],
  decades: [],
  artists: [],
  genres: [],
  styles: [],
  collections: [],
  discovery: null,
}

const byYearThenRank = (a: Album, b: Album) =>
  firstChartYear(a) - firstChartYear(b) || (a.charts?.[0]?.rank ?? 0) - (b.charts?.[0]?.rank ?? 0)

const ALBUMS_BY_DECADE = new Map<Decade, Album[]>()
for (const album of [...CHART_ALBUMS].sort(byYearThenRank)) {
  const decade = decadeOf(firstChartYear(album))
  ALBUMS_BY_DECADE.set(decade, [...(ALBUMS_BY_DECADE.get(decade) ?? []), album])
}

const DECADE_SHELVES: Shelf[] = DECADE_OPTIONS.filter((option) => ALBUMS_BY_DECADE.has(option.value)).map(
  (option, position) => ({
    id: `decada-${option.value}`,
    name: option.label,
    position,
    createdAt: '2026-10-13T00:00:00.000Z',
    filters: { ...EMPTY_FILTERS, decades: [option.value] },
  }),
)

export function useShelves(): Shelf[] {
  return DECADE_SHELVES
}

export function useShelf(id: string | undefined): Shelf | undefined {
  return DECADE_SHELVES.find((shelf) => shelf.id === id)
}

/** Discos de una estantería, por año de entrada en la lista y puesto. */
export function useShelfAlbums(shelfId: string | undefined): Album[] {
  const shelf = DECADE_SHELVES.find((s) => s.id === shelfId)
  const decade = shelf?.filters.decades[0]
  return (decade && ALBUMS_BY_DECADE.get(decade)) || []
}
