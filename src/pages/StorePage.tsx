import { useEffect } from 'react'
import { Store3D } from '@/components/store3d/Store3D'

/** Portada: la tienda 3D a pantalla completa, sin cabecera, como al entrar en un juego. */
export function StorePage() {
  // La página no se desplaza: toda la experiencia ocupa la ventana.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <main className="fixed inset-0 h-[100dvh] w-full">
      <Store3D />
    </main>
  )
}
