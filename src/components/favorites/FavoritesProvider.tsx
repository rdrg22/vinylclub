/**
 * Favoritos. Con sesión iniciada se guardan en tu cuenta (Firestore) y están en todos tus
 * dispositivos; sin sesión son temporales (en memoria, se borran al recargar).
 * Al entrar en la cuenta, los que marcaste antes de entrar se suman a los guardados.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '@/components/auth/authContext'
import { CHART_ALBUMS } from '@/data/charts/chartCatalog'
import { firestoreFavorites, type FavoritesStore } from '@/services/favorites/favorites'
import { db } from '@/services/firebase'
import type { Album } from '@/types/music'
import { FavoritesContext } from './favoritesContext'

const CATALOG = new Map(CHART_ALBUMS.map((a) => [a.id, a]))

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { state } = useAuth()
  const userId = state.status === 'signed-in' ? state.user.id : null
  const store = useMemo<FavoritesStore | null>(() => (userId && db ? firestoreFavorites(db, userId, CATALOG) : null), [userId])

  const [albums, setAlbums] = useState<Album[]>([])
  const albumsRef = useRef(albums)
  albumsRef.current = albums

  // Al entrar: se cargan los guardados y se les suman los marcados sin sesión.
  // Al salir: la lista vuelve a empezar vacía (temporal).
  useEffect(() => {
    if (!store) {
      if (state.status === 'signed-out') setAlbums([])
      return
    }
    let alive = true
    const pending = albumsRef.current
    store
      .list()
      .then(async (saved) => {
        const ids = new Set(saved.map((a) => a.id))
        const extra = pending.filter((a) => !ids.has(a.id))
        await Promise.all(extra.map((a) => store.add(a).catch(() => undefined)))
        if (alive) setAlbums([...saved, ...extra])
      })
      .catch(() => {
        // Sin conexión o sin permiso: se siguen usando los de memoria.
      })
    return () => {
      alive = false
    }
  }, [store, state.status])

  const toggle = useCallback(
    (album: Album) => {
      const isFav = albumsRef.current.some((a) => a.id === album.id)
      // Al momento en pantalla; la cuenta se actualiza por detrás y, si falla, se deshace.
      setAlbums((prev) => (isFav ? prev.filter((a) => a.id !== album.id) : [...prev, album]))
      if (!store) return
      const write = isFav ? store.remove(album.id) : store.add(album)
      write.catch(() => setAlbums((prev) => (isFav ? [...prev, album] : prev.filter((a) => a.id !== album.id))))
    },
    [store],
  )

  const api = useMemo(() => {
    const ids = new Set(albums.map((a) => a.id))
    return { albums, toggle, isFavorite: (id: string) => ids.has(id), saved: store !== null }
  }, [albums, toggle, store])

  return <FavoritesContext.Provider value={api}>{children}</FavoritesContext.Provider>
}
