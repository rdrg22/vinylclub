import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ArtistPage } from '@/pages/ArtistPage'
import { HomePage } from '@/pages/HomePage'
import { LibraryPage } from '@/pages/LibraryPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { SearchPage } from '@/pages/SearchPage'
import { ShelfDetailPage } from '@/pages/ShelfDetailPage'
import { ShelfEditorPage } from '@/pages/ShelfEditorPage'

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'buscar', element: <SearchPage /> },
      { path: 'artista/:artistId', element: <ArtistPage /> },
      { path: 'estanteria/:shelfId', element: <ShelfDetailPage /> },
      { path: 'estanterias/nueva', element: <ShelfEditorPage /> },
      { path: 'coleccion', element: <LibraryPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
