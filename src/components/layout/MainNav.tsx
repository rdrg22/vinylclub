import { NavLink } from 'react-router-dom'
import { useFavorites } from '@/components/favorites/favoritesContext'
import { cn } from '@/utils/cn'

// «Buscar» se oculta en móvil: allí el buscador ya ocupa su propia fila en la cabecera.
const ITEMS = [
  { to: '/', label: 'Tienda', end: true, desktopOnly: false },
  { to: '/estanterias', label: 'Estanterías', end: false, desktopOnly: false },
  { to: '/buscar', label: 'Buscar', end: false, desktopOnly: true },
  { to: '/favoritos', label: 'Favoritos', end: false, desktopOnly: false },
] as const

export function MainNav({ className }: { className?: string }) {
  const { albums: favorites } = useFavorites()
  return (
    <nav aria-label="Principal" className={className}>
      <ul className="flex items-center gap-5 sm:gap-7">
        {ITEMS.map((item) => (
          <li key={item.to} className={item.desktopOnly ? 'hidden md:block' : undefined}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'label-mono relative inline-block py-2 transition-colors hover:text-ink',
                  "after:absolute after:inset-x-0 after:bottom-0.5 after:h-0.5 after:origin-left after:bg-signal after:transition-transform after:duration-300 after:content-['']",
                  isActive ? 'text-ink after:scale-x-100' : 'text-ink-soft after:scale-x-0',
                )
              }
            >
              {item.label}
              {item.to === '/favoritos' && favorites.length > 0 && (
                <span className="ml-1.5 rounded-full bg-signal px-1.5 py-px text-[0.6rem] text-paper">{favorites.length}</span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
