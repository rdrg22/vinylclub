import { createContext, useContext } from 'react'
import type { CollectionItem } from '@/services/collection/collection'
import type { Release } from '@/types/music'

export interface CollectionApi {
  /** `off`: sin sesión (y no es modo demostración). */
  status: 'off' | 'loading' | 'ready' | 'error'
  /** Dónde se guarda: en la cuenta (nube) o solo en este navegador (modo demostración). */
  where: 'account' | 'browser'
  items: CollectionItem[]
  has: (releaseId: string) => boolean
  /** Devuelve un mensaje de error, o null si se ha añadido. */
  add: (release: Release) => Promise<string | null>
  remove: (id: string) => Promise<string | null>
  reload: () => void
}

export const CollectionContext = createContext<CollectionApi | null>(null)

export function useCollection(): CollectionApi {
  const ctx = useContext(CollectionContext)
  if (!ctx) throw new Error('useCollection debe usarse dentro de <CollectionProvider>')
  return ctx
}
