import { Link, useParams } from 'react-router-dom'
import { AlbumGrid } from '@/components/album/AlbumGrid'
import { buttonClass } from '@/components/ui/buttonStyles'
import { PageHeader } from '@/components/ui/PageHeader'
import { StateMessage } from '@/components/ui/StateMessage'
import { CHART_SOURCE, chartSourceUrl, chartYearSource, firstChartYear } from '@/data/charts/chartCatalog'
import { useShelf, useShelfAlbums } from '@/hooks/useShelves'
import type { Album } from '@/types/music'

/** Todos los discos de una década, separados por año como los separadores de una cubeta. */
export function ShelfDetailPage() {
  const { shelfId } = useParams()
  const shelf = useShelf(shelfId)
  const albums = useShelfAlbums(shelf?.id)

  if (!shelf) {
    return (
      <StateMessage
        eyebrow="Estantería no encontrada"
        title="Esta estantería no está en la tienda"
        action={<Link to="/" className={buttonClass('quiet')}>Volver a mi tienda</Link>}
        headingLevel="h1"
        className="mt-14"
      >
        Puede que el enlace no sea correcto.
      </StateMessage>
    )
  }

  const byYear = new Map<number, Album[]>()
  for (const album of albums) byYear.set(firstChartYear(album), [...(byYear.get(firstChartYear(album)) ?? []), album])
  const years = [...byYear.keys()]

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to="/" className="transition-colors hover:text-signal">
            ← Mi tienda
          </Link>
        }
        title={shelf.name}
      >
        <p>Los álbumes más vendidos de cada año en EE. UU., según las listas anuales de Billboard.</p>
        <p className="label-mono mt-2">
          {albums.length} discos · {years.length} años
        </p>
      </PageHeader>

      {years.length > 0 ? (
        <>
          <nav aria-label="Saltar a un año" className="mb-4 border-y border-ink py-2">
            <ul className="no-scrollbar flex gap-1 overflow-x-auto">
              {years.map((year) => (
                <li key={year}>
                  <a href={`#y${year}`} className="label-mono block px-2.5 py-1.5 transition-colors hover:bg-ink hover:text-paper">
                    {year}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {years.map((year) => (
            <section key={year} id={`y${year}`} aria-labelledby={`y${year}-title`} className="scroll-mt-40 pt-8 pb-6">
              <div className="mb-6 flex items-baseline gap-4 border-b border-rule pb-3">
                <h2 id={`y${year}-title`} className="font-display text-4xl font-medium tracking-tight">
                  {year}
                </h2>
                <a
                  href={chartSourceUrl(year)}
                  target="_blank"
                  rel="noreferrer"
                  className="label-mono ml-auto text-ink-faint hover:text-signal"
                >
                  {chartYearSource(year) ? 'Solo se conoce el nº 1 · Wikipedia ↗' : `Lista de ${year} ↗`}
                </a>
              </div>
              <AlbumGrid albums={byYear.get(year) ?? []} label={`Discos de ${year}`} />
            </section>
          ))}

          <p className="label-mono mt-10 text-ink-faint">
            Fuente: {CHART_SOURCE}. Los discos que repiten en la lista aparecen en su primer año. Antes de 1992 Billboard elaboraba
            la lista con encuestas a tiendas, no con ventas contabilizadas.
          </p>
        </>
      ) : (
        <StateMessage eyebrow="Sin discos" title="Esta década todavía no tiene discos" />
      )}
    </>
  )
}
