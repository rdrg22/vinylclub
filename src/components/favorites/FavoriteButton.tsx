import type { Album } from '@/types/music'
import { cn } from '@/utils/cn'
import { useFavorites } from './favoritesContext'

interface FavoriteButtonProps {
  album: Album
  /** `dark`: sobre la madera de la tienda 3D. `light`: sobre el papel de la web. */
  tone?: 'light' | 'dark'
  className?: string
}

/** Estrella para marcar o quitar un disco de favoritos. */
export function FavoriteButton({ album, tone = 'light', className }: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorites()
  const active = isFavorite(album.id)

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        toggle(album)
      }}
      aria-pressed={active}
      aria-label={active ? `Quitar ${album.title} de favoritos` : `Añadir ${album.title} a favoritos`}
      title={active ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      className={cn(
        'group/star grid size-10 shrink-0 place-items-center rounded-full border transition-[background-color,border-color,transform] duration-200 active:scale-90',
        tone === 'dark'
          ? 'border-[#e8c98f]/50 hover:border-[#e8c98f] hover:bg-[#e8c98f]/10'
          : 'border-rule hover:border-ink',
        active && (tone === 'dark' ? 'border-[#e8c98f] bg-[#e8c98f]/15' : 'border-ink bg-paper-deep'),
        className,
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={cn(
          'size-5 transition-transform duration-300 ease-out-soft',
          active ? 'scale-110 fill-[#f2b01e] text-[#f2b01e]' : cn('fill-none group-hover/star:scale-110', tone === 'dark' ? 'text-[#f3e4c3]' : 'text-ink'),
        )}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      >
        <path d="m12 3.2 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.6l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8Z" />
      </svg>
    </button>
  )
}
