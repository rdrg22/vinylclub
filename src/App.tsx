import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RootLayout } from '@/components/layout/RootLayout'
import { ArtistPage } from '@/pages/ArtistPage'
import { ShelvesPage } from '@/pages/ShelvesPage'
import { StorePage } from '@/pages/StorePage'
import { LibraryPage } from '@/pages/LibraryPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { SearchPage } from '@/pages/SearchPage'
import { ShelfDetailPage } from '@/pages/ShelfDetailPage'
import { ShelfEditorPage } from '@/pages/ShelfEditorPage'

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
          { path: 'estanterias/nueva', element: <ShelfEditorPage /> },
          { path: 'coleccion', element: <LibraryPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
