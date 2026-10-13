import { createContext, useContext } from 'react'
import type { Album } from '@/types/music'

export interface AlbumDetailApi {
  openAlbum: (album: Album) => void
}

export const AlbumDetailContext = createContext<AlbumDetailApi | null>(null)

export function useAlbumDetail(): AlbumDetailApi {
  const ctx = useContext(AlbumDetailContext)
  if (!ctx) throw new Error('useAlbumDetail debe usarse dentro de <AlbumDetailProvider>')
  return ctx
}
