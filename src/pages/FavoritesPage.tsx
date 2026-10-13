import { Link } from 'react-router-dom'
import { AlbumGrid } from '@/components/album/AlbumGrid'
import { useFavorites } from '@/components/favorites/favoritesContext'
import { buttonClass } from '@/components/ui/buttonStyles'
import { PageHeader } from '@/components/ui/PageHeader'
import { StateMessage } from '@/components/ui/StateMessage'

/** Discos marcados con la estrella en esta visita. */
export function FavoritesPage() {
  const { albums } = useFavorites()

  return (
    <>
      <PageHeader eyebrow={albums.length === 1 ? '1 disco' : `${albums.length} discos`} title="Favoritos">
        Los discos que has marcado con la estrella. De momento se guardan solo mientras no recargues la página.
      </PageHeader>

      {albums.length > 0 ? (
        <AlbumGrid albums={albums} label="Tus favoritos" className="border-t-2 border-ink pt-6" />
      ) : (
        <StateMessage
          eyebrow="Sin favoritos"
          title="Todavía no has marcado ningún disco"
          action={
            <Link to="/" className={buttonClass('primary')}>
              Entrar en la tienda
            </Link>
          }
        >
          Coge un disco de la balda y pulsa la estrella para guardarlo aquí.
        </StateMessage>
      )}
    </>
  )
}
