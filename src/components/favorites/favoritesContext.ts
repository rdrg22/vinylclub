import { createContext, useContext } from 'react'
import type { AlbumListApi } from './useAlbumList'

export interface FavoritesApi extends AlbumListApi {
  isFavorite: (albumId: string) => boolean
}

export const FavoritesContext = createContext<FavoritesApi | null>(null)

export function useFavorites(): FavoritesApi {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites debe usarse dentro de <FavoritesProvider>')
  return ctx
}

/** Lista de deseos: discos que el usuario quiere comprar («Lo quiero»). */
export const WishlistContext = createContext<AlbumListApi | null>(null)

export function useWishlist(): AlbumListApi {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist debe usarse dentro de <FavoritesProvider>')
  return ctx
}
