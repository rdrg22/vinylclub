import { Link } from 'react-router-dom'
import { bestRank, firstChartYear } from '@/data/charts/chartCatalog'
import { useShelfAlbums } from '@/hooks/useShelves'
import type { Shelf } from '@/types/shelf'
import { binLetter } from '@/utils/shelfFilters'
import { ShelfRail } from './ShelfRail'

const PREVIEW = 20

interface ShelfSectionProps {
  shelf: Shelf
  index: number
}

/** Una estantería de la tienda: separador con letra, nombre, filtros y fila de discos. */
export function ShelfSection({ shelf, index }: ShelfSectionProps) {
  const albums = useShelfAlbums(shelf.id)
  const headingId = `shelf-${shelf.id}`
  // En la balda, primero los nº 1 de cada año, luego los nº 2…; la vista completa va por años.
  const preview = [...albums].sort((a, b) => bestRank(a) - bestRank(b) || firstChartYear(a) - firstChartYear(b)).slice(0, PREVIEW)
  const years = albums.map(firstChartYear)
  const span = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : ''

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
          <p className="label-mono mt-2 text-ink-faint">Top 10 anual de Billboard · {span}</p>
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
          Esta estantería todavía no tiene discos.
        </p>
      )}
    </section>
  )
}
