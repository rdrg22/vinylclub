import { Link } from 'react-router-dom'
import { DiscoverySection } from '@/components/discovery/DiscoverySection'
import { ShelfSection } from '@/components/shelf/ShelfSection'
import { Store3D } from '@/components/store3d/Store3D'
import { buttonClass } from '@/components/ui/buttonStyles'
import { PageHeader } from '@/components/ui/PageHeader'
import { StateMessage } from '@/components/ui/StateMessage'
import { useShelves } from '@/hooks/useShelves'

const LIBRARY_LINKS = [
  { to: '/coleccion?tab=favoritos', title: 'Favoritos', text: 'Los discos que has marcado para volver a ellos.' },
  { to: '/coleccion?tab=coleccion', title: 'Mi colección', text: 'Lo que ya tienes en tus estanterías de casa.' },
] as const

export function HomePage() {
  const shelves = useShelves()
  const newShelf = (
    <Link to="/estanterias/nueva" className={buttonClass('primary')}>
      <span aria-hidden className="text-lg leading-none">+</span> Nueva estantería
    </Link>
  )

  return (
    <>
      <PageHeader
        eyebrow={shelves.length === 1 ? '1 estantería' : `${shelves.length} estanterías`}
        title="Mi tienda"
        action={newShelf}
      >
        Los diez álbumes más vendidos de cada año en EE. UU., década a década, según las listas anuales de Billboard.
        Entra, recorre los pasillos y saca un disco de la balda para escucharlo.
      </PageHeader>

      <section aria-label="Tienda en 3D" className="-mx-4 sm:-mx-8">
        <Store3D />
      </section>

      <h2 className="mt-14 font-display text-4xl font-medium tracking-tight italic sm:text-5xl">Las estanterías</h2>
      <p className="mt-2 text-ink-soft">Los mismos discos, en lista: más rápido si ya sabes lo que buscas.</p>

      {shelves.length > 0 ? (
        <div className="divide-y divide-rule">
          {shelves.map((shelf, index) => (
            <ShelfSection key={shelf.id} shelf={shelf} index={index} />
          ))}
        </div>
      ) : (
        <StateMessage
          eyebrow="Tienda vacía"
          title="Todavía no hay estanterías en tu tienda"
          action={newShelf}
        >
          Crea la primera eligiendo décadas, géneros y tipos de disco. Podrás reordenarlas cuando quieras.
        </StateMessage>
      )}

      <DiscoverySection />

      <nav aria-label="Tu biblioteca" className="mt-16 grid border-t-2 border-ink sm:grid-cols-2">
        {LIBRARY_LINKS.map((link, i) => (
          <Link
            key={link.to}
            to={link.to}
            className={`group flex items-end justify-between gap-6 border-b border-rule py-8 sm:border-b-0 ${i === 0 ? 'sm:border-r sm:pr-8' : 'sm:pl-8'}`}
          >
            <span>
              <span className="block font-display text-3xl font-medium tracking-tight transition-colors group-hover:text-signal sm:text-4xl">
                {link.title}
              </span>
              <span className="mt-2 block text-ink-soft">{link.text}</span>
            </span>
            <span aria-hidden className="text-2xl transition-transform duration-300 group-hover:translate-x-1.5">
              →
            </span>
          </Link>
        ))}
      </nav>
    </>
  )
}
