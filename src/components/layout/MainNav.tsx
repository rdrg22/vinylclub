import { NavLink } from 'react-router-dom'
import { cn } from '@/utils/cn'

// «Buscar» se oculta en móvil: allí el buscador ya ocupa su propia fila en la cabecera.
const ITEMS = [
  { to: '/', label: 'Mi tienda', end: true, desktopOnly: false },
  { to: '/buscar', label: 'Buscar', end: false, desktopOnly: true },
  { to: '/coleccion', label: 'Colección', end: false, desktopOnly: false },
] as const

export function MainNav({ className }: { className?: string }) {
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
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
