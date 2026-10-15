import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AlbumDetailProvider } from '@/components/album/AlbumDetailProvider'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { CollectionProvider } from '@/components/collection/CollectionProvider'
import { FavoritesProvider } from '@/components/favorites/FavoritesProvider'
import { NowPlayingBar } from '@/components/player/NowPlayingBar'
import { PreviewPlayerProvider } from '@/components/player/PreviewPlayerProvider'

/**
 * Común a todas las rutas: cuenta y colección, ficha del disco y reproductor de demos (que siguen
 * sonando al pasar de la tienda 3D a la búsqueda y viceversa).
 */
export function RootLayout() {
  const { pathname } = useLocation()

  // Cada página nueva empieza arriba, como al cambiar de pasillo.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <AuthProvider>
      <CollectionProvider>
        <FavoritesProvider>
          <PreviewPlayerProvider>
            <AlbumDetailProvider>
              <Outlet />
              <NowPlayingBar />
            </AlbumDetailProvider>
          </PreviewPlayerProvider>
        </FavoritesProvider>
      </CollectionProvider>
    </AuthProvider>
  )
}
