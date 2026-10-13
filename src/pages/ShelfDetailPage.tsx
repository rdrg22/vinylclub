import { Link, useParams } from 'react-router-dom'
import { AlbumGrid } from '@/components/album/AlbumGrid'
import { FilterChips } from '@/components/shelf/FilterChips'
import { buttonClass } from '@/components/ui/buttonStyles'
import { PageHeader } from '@/components/ui/PageHeader'
import { StateMessage } from '@/components/ui/StateMessage'
import { useShelf, useShelfAlbums } from '@/hooks/useShelves'
import { describeFilters } from '@/utils/shelfFilters'

/** Todos los discos de una estantería, en rejilla. */
export function ShelfDetailPage() {
  const { shelfId } = useParams()
  const shelf = useShelf(shelfId)
  const albums = useShelfAlbums(shelf?.id)

  if (!shelf) {
    return (
      <StateMessage
        eyebrow="Estantería no encontrada"
        title="Esta estantería no está en tu tienda"
        action={<Link to="/" className={buttonClass('quiet')}>Volver a mi tienda</Link>}
        headingLevel="h1"
        className="mt-14"
      >
        Puede que la hayas eliminado o que el enlace no sea correcto.
      </StateMessage>
    )
  }

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
        <FilterChips labels={describeFilters(shelf.filters)} />
        <p className="label-mono mt-2">{albums.length} discos</p>
      </PageHeader>

      {albums.length > 0 ? (
        <AlbumGrid albums={albums} label={`Discos de ${shelf.name}`} className="border-t-2 border-ink pt-6" />
      ) : (
        <StateMessage eyebrow="Sin discos" title="No hay discos que cumplan estos filtros">
          Prueba a ampliar las décadas o los géneros de la estantería.
        </StateMessage>
      )}
    </>
  )
}
