/**
 * Lo que ha sonado en el tocadiscos del mostrador: users/{uid}/plays/{id} en Firestore.
 * Se guarda una copia mínima del disco (como los favoritos) y la hora.
 */
import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp, type Firestore } from 'firebase/firestore'
import { albumFromFavorite, toFavoriteDoc, type FavoriteDoc } from '@/services/favorites/albumLists'
import type { Album } from '@/types/music'

export interface Play {
  album: Album
  /** ISO. */
  playedAt: string
}

/** Cuántas escuchas se recuerdan (las más recientes). */
export const PLAY_HISTORY = 20

interface PlayDoc extends Omit<FavoriteDoc, 'addedAt'> {
  playedAt: { toDate(): Date } | null
}

export interface PlaysStore {
  /** De la más reciente a la más antigua. */
  list(): Promise<Play[]>
  add(album: Album): Promise<void>
}

export function firestorePlays(db: Firestore, uid: string, catalog: ReadonlyMap<string, Album>): PlaysStore {
  const items = collection(db, 'users', uid, 'plays')
  return {
    async list() {
      const snap = await getDocs(query(items, orderBy('playedAt', 'desc'), limit(PLAY_HISTORY)))
      return snap.docs.map((d) => {
        const data = d.data() as PlayDoc
        return { album: albumFromFavorite(data, catalog), playedAt: (data.playedAt?.toDate() ?? new Date()).toISOString() }
      })
    },
    async add(album) {
      await addDoc(items, { ...toFavoriteDoc(album), playedAt: serverTimestamp() })
    },
  }
}

/** «hace un momento», «hace 12 min», «hoy 18:05», «ayer 22:10», «3 oct». */
export function whenPlayed(iso: string, now = new Date()): string {
  const date = new Date(iso)
  const minutes = Math.round((now.getTime() - date.getTime()) / 60000)
  if (minutes < 1) return 'hace un momento'
  if (minutes < 60) return `hace ${minutes} min`
  const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  if (date.getTime() >= startOfToday) return `hoy ${time}`
  if (date.getTime() >= startOfToday - 86400000) return `ayer ${time}`
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '')
}
