import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RootLayout } from '@/components/layout/RootLayout'
import { ArtistPage } from '@/pages/ArtistPage'
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
          // La antigua «Colección» se convirtió en «Favoritos».
          { path: 'coleccion', element: <Navigate to="/favoritos" replace /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
