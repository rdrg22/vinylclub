import type { Album } from '@/types/music'
import { cn } from '@/utils/cn'
import { AlbumTile } from './AlbumTile'

/** Rejilla de fundas: estantería completa, resultados de búsqueda, discografía. */
export function AlbumGrid({ albums, className, label }: { albums: Album[]; className?: string; label?: string }) {
  return (
    <ul
      aria-label={label}
      className={cn('grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 md:grid-cols-4 lg:grid-cols-5', className)}
    >
      {albums.map((album, i) => (
        <li key={album.id}>
          <AlbumTile album={album} eager={i < 10} />
        </li>
      ))}
    </ul>
  )
}
