/**
 * Lista de discos del usuario (favoritos, «Lo quiero»). Con sesión iniciada se guarda en
 * su cuenta (Firestore) y está en todos sus dispositivos; sin sesión es temporal (en
 * memoria, se borra al recargar). Al entrar en la cuenta, los discos marcados antes de
 * entrar se suman a los guardados.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/authContext'
import { CHART_ALBUMS } from '@/data/charts/chartCatalog'
import { firestoreAlbumList, type AlbumListName, type FavoritesStore } from '@/services/favorites/albumLists'
import { db } from '@/services/firebase'
import type { Album } from '@/types/music'

const CATALOG = new Map(CHART_ALBUMS.map((a) => [a.id, a]))

export interface AlbumListApi {
  /** En el orden en que se marcaron. */
  albums: Album[]
  has: (albumId: string) => boolean
  toggle: (album: Album) => void
  /** Guardada en la cuenta (true) o temporal hasta recargar (false). */
  saved: boolean
}

export function useAlbumList(list: AlbumListName): AlbumListApi {
  const { state } = useAuth()
  const userId = state.status === 'signed-in' ? state.user.id : null
  const store = useMemo<FavoritesStore | null>(() => (userId && db ? firestoreAlbumList(db, userId, list, CATALOG) : null), [userId, list])

  const [albums, setAlbums] = useState<Album[]>([])
  const albumsRef = useRef(albums)
  albumsRef.current = albums

  useEffect(() => {
    if (!store) {
      // Al cerrar sesión la lista vuelve a empezar vacía (temporal).
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
        // Sin conexión o sin permiso: se sigue con la lista en memoria.
      })
    return () => {
      alive = false
    }
  }, [store, state.status])

  const toggle = useCallback(
    (album: Album) => {
      const listed = albumsRef.current.some((a) => a.id === album.id)
      // Al momento en pantalla; la cuenta se actualiza por detrás y, si falla, se deshace.
      setAlbums((prev) => (listed ? prev.filter((a) => a.id !== album.id) : [...prev, album]))
      if (!store) return
      const write = listed ? store.remove(album.id) : store.add(album)
      write.catch(() => setAlbums((prev) => (listed ? [...prev, album] : prev.filter((a) => a.id !== album.id))))
    },
    [store],
  )

  return useMemo(() => {
    const ids = new Set(albums.map((a) => a.id))
    return { albums, toggle, has: (id: string) => ids.has(id), saved: store !== null }
  }, [albums, toggle, store])
}
