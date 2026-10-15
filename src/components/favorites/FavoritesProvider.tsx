import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { Album } from '@/types/music'
import { FavoritesContext } from './favoritesContext'

/**
 * Favoritos temporales: viven en memoria mientras la página está abierta (sobreviven
 * a la navegación entre secciones, no a una recarga). Cuando haya cuentas de usuario
 * se guardarán en Firebase.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [albums, setAlbums] = useState<Album[]>([])

  const toggle = useCallback((album: Album) => {
    setAlbums((prev) => (prev.some((a) => a.id === album.id) ? prev.filter((a) => a.id !== album.id) : [...prev, album]))
  }, [])

  const api = useMemo(() => {
    const ids = new Set(albums.map((a) => a.id))
    return { albums, toggle, isFavorite: (id: string) => ids.has(id) }
  }, [albums, toggle])

  return <FavoritesContext.Provider value={api}>{children}</FavoritesContext.Provider>
}
