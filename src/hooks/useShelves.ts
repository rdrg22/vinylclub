import { useMemo } from 'react'
import { isDemoMode } from '@/config/env'
import { DEMO_SHELF_ALBUMS, DEMO_SHELVES } from '@/data/demo/demoCatalog'
import type { Album } from '@/types/music'
import type { Shelf } from '@/types/shelf'

/*
 * Fase 1: la única fuente es el catálogo de demostración.
 * Con Supabase configurado aún no hay persistencia, así que la tienda aparece vacía.
 * En las fases 3 y 4 estos hooks pasarán a leer del repositorio de estanterías
 * y los discos se resolverán contra MusicBrainz a partir de los filtros.
 */

export function useShelves(): Shelf[] {
  return useMemo(
    () => (isDemoMode ? [...DEMO_SHELVES].sort((a, b) => a.position - b.position) : []),
    [],
  )
}

export function useShelf(id: string | undefined): Shelf | undefined {
  const shelves = useShelves()
  return shelves.find((shelf) => shelf.id === id)
}

export function useShelfAlbums(shelfId: string | undefined): Album[] {
  return (isDemoMode && shelfId && DEMO_SHELF_ALBUMS[shelfId]) || []
}
