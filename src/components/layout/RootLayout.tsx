import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AlbumDetailProvider } from '@/components/album/AlbumDetailProvider'
import { FavoritesProvider } from '@/components/favorites/FavoritesProvider'
import { NowPlayingBar } from '@/components/player/NowPlayingBar'
import { PreviewPlayerProvider } from '@/components/player/PreviewPlayerProvider'

/**
 * Común a todas las rutas: ficha del disco y reproductor de demos (que siguen
 * sonando al pasar de la tienda 3D a la búsqueda y viceversa).
 */
export function RootLayout() {
  const { pathname } = useLocation()

  // Cada página nueva empieza arriba, como al cambiar de pasillo.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <FavoritesProvider>
      <PreviewPlayerProvider>
        <AlbumDetailProvider>
          <Outlet />
          <NowPlayingBar />
        </AlbumDetailProvider>
      </PreviewPlayerProvider>
    </FavoritesProvider>
  )
}
