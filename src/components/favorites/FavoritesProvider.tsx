/** Favoritos (la estrella) y lista de deseos («Lo quiero»): ver useAlbumList. */
import { useMemo, type ReactNode } from 'react'
import { FavoritesContext, WishlistContext } from './favoritesContext'
import { useAlbumList } from './useAlbumList'

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const favorites = useAlbumList('favorites')
  const wishlist = useAlbumList('wishlist')
  const favoritesApi = useMemo(() => ({ ...favorites, isFavorite: favorites.has }), [favorites])
  return (
    <FavoritesContext.Provider value={favoritesApi}>
      <WishlistContext.Provider value={wishlist}>{children}</WishlistContext.Provider>
    </FavoritesContext.Provider>
  )
}
