import {
  COLLECTION_OPTIONS,
  DECADE_OPTIONS,
  DISCOVERY_OPTIONS,
  GENRE_OPTIONS,
  RELEASE_TYPE_OPTIONS,
  STYLE_OPTIONS,
  type FilterOption,
} from '@/config/shelfFilters'
import type { ShelfFilters } from '@/types/shelf'

const labelsFor = <T extends string>(options: FilterOption<T>[], values: readonly T[]) =>
  values.map((value) => options.find((option) => option.value === value)?.label ?? value)

/** Resumen legible de los filtros de una estantería, en el orden del configurador. */
export function describeFilters(filters: ShelfFilters): string[] {
  return [
    ...labelsFor(RELEASE_TYPE_OPTIONS, filters.releaseTypes),
    ...labelsFor(DECADE_OPTIONS, filters.decades),
    ...filters.artists.map((artist) => artist.name),
    ...labelsFor(GENRE_OPTIONS, filters.genres),
    ...labelsFor(STYLE_OPTIONS, filters.styles),
    ...labelsFor(COLLECTION_OPTIONS, filters.collections),
    ...(filters.discovery ? labelsFor(DISCOVERY_OPTIONS, [filters.discovery]) : []),
  ]
}

/** Letra de separador de cubeta, como en una tienda física: A, B, C… Z, AA, AB… */
export function binLetter(index: number): string {
  let n = index
  let out = ''
  do {
    out = String.fromCharCode(65 + (n % 26)) + out
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return out
}
