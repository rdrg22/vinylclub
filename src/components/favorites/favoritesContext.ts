import { createContext, useContext } from 'react'
import type { Album } from '@/types/music'

export interface FavoritesApi {
  /** Discos favoritos en el orden en que se marcaron. */
  albums: Album[]
  isFavorite: (albumId: string) => boolean
  toggle: (album: Album) => void
}

export const FavoritesContext = createContext<FavoritesApi | null>(null)

export function useFavorites(): FavoritesApi {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites debe usarse dentro de <FavoritesProvider>')
  return ctx
}
