import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { RootLayout } from '@/components/layout/RootLayout'
import { StorePage } from '@/pages/StorePage'

// Todo ocurre dentro de la tienda 3D: buscar, favoritos, cuenta y colección son ventanas
// suyas. Cualquier otra dirección (enlaces antiguos como /buscar o /coleccion) lleva a ella.
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <StorePage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
