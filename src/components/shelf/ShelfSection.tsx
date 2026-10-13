import { Link } from 'react-router-dom'
import { useShelfAlbums } from '@/hooks/useShelves'
import type { Shelf } from '@/types/shelf'
import { binLetter, describeFilters } from '@/utils/shelfFilters'
import { FilterChips } from './FilterChips'
import { ShelfRail } from './ShelfRail'

interface ShelfSectionProps {
  shelf: Shelf
  index: number
}

/** Una estantería de la tienda: separador con letra, nombre, filtros y fila de discos. */
export function ShelfSection({ shelf, index }: ShelfSectionProps) {
  const albums = useShelfAlbums(shelf.id)
  const headingId = `shelf-${shelf.id}`
  const preview = albums.slice(0, 12)

  return (
    <section aria-labelledby={headingId} className="py-8 sm:py-10">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-x-6">
        <span
          aria-hidden
          className="mt-0.5 grid h-10 min-w-8 place-items-center bg-ink px-2 font-display text-xl font-semibold text-paper"
        >
          {binLetter(index)}
        </span>
        <div>
          <h2 id={headingId} className="font-display text-2xl leading-tight font-medium tracking-tight sm:text-3xl">
            {shelf.name}
          </h2>
          <FilterChips labels={describeFilters(shelf.filters)} className="mt-2" />
        </div>
        <Link
          to={`/estanteria/${shelf.id}`}
          className="label-mono group col-start-2 inline-flex items-center gap-2 justify-self-start border-b border-ink pb-0.5 transition-colors hover:border-signal hover:text-signal sm:col-start-3 sm:self-end"
        >
          Ver los {albums.length} discos
          <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </header>

      {preview.length > 0 ? (
        <ShelfRail albums={preview} label={`Discos de ${shelf.name}`} eager={index < 2} />
      ) : (
        <p className="mt-6 border-y border-dashed border-rule py-10 text-center text-ink-soft">
          Esta estantería todavía no tiene discos con estos filtros.
        </p>
      )}
    </section>
  )
}
