import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import type { Album } from '@/types/music'
import { AlbumDetailContext } from './albumDetailContext'
import { AlbumDialog } from './AlbumDialog'

/** Permite abrir la ficha de un disco desde cualquier portada de la app. */
export function AlbumDetailProvider({ children }: { children: ReactNode }) {
  const [album, setAlbum] = useState<Album | null>(null)
  const close = useCallback(() => setAlbum(null), [])
  const api = useMemo(() => ({ openAlbum: setAlbum }), [])
  const { pathname } = useLocation()

  // Cambiar de página (incluido «Atrás» del navegador) cierra la ficha abierta.
  useEffect(() => {
    setAlbum(null)
  }, [pathname])

  return (
    <AlbumDetailContext.Provider value={api}>
      {children}
      <AlbumDialog album={album} onClose={close} />
    </AlbumDetailContext.Provider>
  )
}
