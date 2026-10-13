import { Link } from 'react-router-dom'
import { DiscoverySection } from '@/components/discovery/DiscoverySection'
import { useFavorites } from '@/components/favorites/favoritesContext'
import { ShelfSection } from '@/components/shelf/ShelfSection'
import { buttonClass } from '@/components/ui/buttonStyles'
import { PageHeader } from '@/components/ui/PageHeader'
import { StateMessage } from '@/components/ui/StateMessage'
import { useShelves } from '@/hooks/useShelves'

/** Las mismas décadas que la tienda 3D, en lista: más rápido si ya sabes lo que buscas. */
export function ShelvesPage() {
  const shelves = useShelves()
  const { albums: favorites } = useFavorites()
  const toStore = (
    <Link to="/" className={buttonClass('primary')}>
      Entrar en la tienda 3D
    </Link>
  )

  return (
    <>
      <PageHeader
        eyebrow={shelves.length === 1 ? '1 estantería' : `${shelves.length} estanterías`}
        title="Estanterías"
        action={toStore}
      >
        Los diez álbumes más vendidos de cada año en EE. UU., década a década, según las listas anuales de Billboard.
      </PageHeader>

      {shelves.length > 0 ? (
        <div className="divide-y divide-rule">
          {shelves.map((shelf, index) => (
            <ShelfSection key={shelf.id} shelf={shelf} index={index} />
          ))}
        </div>
      ) : (
        <StateMessage eyebrow="Tienda vacía" title="El catálogo de la tienda no está disponible" />
      )}

      <DiscoverySection />

      <Link
        to="/favoritos"
        className="group mt-16 flex items-end justify-between gap-6 border-t-2 border-ink py-8"
      >
        <span>
          <span className="block font-display text-3xl font-medium tracking-tight transition-colors group-hover:text-signal sm:text-4xl">
            Favoritos{favorites.length > 0 && <span className="text-ink-faint"> · {favorites.length}</span>}
          </span>
          <span className="mt-2 block text-ink-soft">Los discos que has marcado con la estrella en esta visita.</span>
        </span>
        <span aria-hidden className="text-2xl transition-transform duration-300 group-hover:translate-x-1.5">
          →
        </span>
      </Link>
    </>
  )
}
