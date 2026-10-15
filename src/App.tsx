import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RootLayout } from '@/components/layout/RootLayout'
import { ArtistPage } from '@/pages/ArtistPage'
import { CollectionPage } from '@/pages/CollectionPage'
import { LoginPage } from '@/pages/LoginPage'
import { ShelvesPage } from '@/pages/ShelvesPage'
import { StorePage } from '@/pages/StorePage'
import { FavoritesPage } from '@/pages/FavoritesPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { SearchPage } from '@/pages/SearchPage'
import { ShelfDetailPage } from '@/pages/ShelfDetailPage'

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // La portada es la tienda 3D a pantalla completa, sin cabecera.
      { index: true, element: <StorePage /> },
      {
        element: <AppShell />,
        children: [
          { path: 'estanterias', element: <ShelvesPage /> },
          { path: 'buscar', element: <SearchPage /> },
          { path: 'artista/:artistId', element: <ArtistPage /> },
          { path: 'estanteria/:shelfId', element: <ShelfDetailPage /> },
          { path: 'favoritos', element: <FavoritesPage /> },
          { path: 'entrar', element: <LoginPage /> },
          { path: 'coleccion', element: <CollectionPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
