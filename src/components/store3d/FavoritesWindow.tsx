/** Ventana de favoritos: los discos marcados con la estrella; al pulsar uno, se coge. */
import { AlbumCover } from '@/components/album/AlbumCover'
import { useFavorites } from '@/components/favorites/favoritesContext'
import type { Album } from '@/types/music'
import { StoreWindow } from './StoreWindow'

interface Props {
  onPick: (album: Album) => void
  onClose: () => void
}

export function FavoritesWindow({ onPick, onClose }: Props) {
  const { albums, saved } = useFavorites()
  return (
    <StoreWindow
      title="Favoritos"
      badge="★"
      subtitle={`${albums.length === 1 ? '1 disco' : `${albums.length} discos`} · ${saved ? 'guardados en tu cuenta' : 'entra en tu cuenta para no perderlos'}`}
      onClose={onClose}
    >
      {albums.length === 0 ? (
        <p className="text-ink-soft">Coge un disco y pulsa la estrella para guardarlo aquí.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-4 sm:grid-cols-5">
          {albums.map((album) => (
            <li key={album.id}>
              <button type="button" onClick={() => onPick(album)} className="group block w-full text-left">
                <AlbumCover album={album} className="aspect-square w-full transition-transform duration-300 group-hover:-translate-y-1" />
                <span className="mt-2 block truncate text-sm font-medium group-hover:text-signal">{album.title}</span>
                <span className="block truncate text-xs text-ink-soft">{album.artist}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </StoreWindow>
  )
}
