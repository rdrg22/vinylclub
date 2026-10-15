/**
 * Favoritos guardados en la cuenta: users/{uid}/favorites/{id del disco} en Firestore.
 *
 * Se guarda una copia mínima del disco. Al leerlos, si el disco está en el catálogo de
 * la tienda se usa el del catálogo (con todos sus datos y puestos en la lista); si no
 * (discos encontrados en Buscar), se reconstruye con la copia.
 */
import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore'
import type { Album } from '@/types/music'

export interface FavoriteDoc {
  albumId: string
  source: Album['source']
  title: string
  artist: string
  year?: number
  firstReleaseDate?: string
  /** Primer puesto en la lista de Billboard, si lo tiene. */
  chartYear?: number
  chartRank?: number
  addedAt: { toDate(): Date } | null
}

/** Firestore no admite `undefined`: los campos vacíos no se escriben. */
export function toFavoriteDoc(album: Album): Omit<FavoriteDoc, 'addedAt'> {
  const data: Omit<FavoriteDoc, 'addedAt'> = {
    albumId: album.id,
    source: album.source,
    title: (album.title || 'Sin título').slice(0, 500),
    artist: (album.artist || 'Artista desconocido').slice(0, 500),
  }
  if (Number.isInteger(album.year)) data.year = album.year
  if (album.firstReleaseDate && /^\d{4}(-\d{2}){0,2}$/.test(album.firstReleaseDate)) data.firstReleaseDate = album.firstReleaseDate
  const chart = album.charts?.[0]
  if (chart) {
    data.chartYear = chart.year
    data.chartRank = chart.rank
  }
  return data
}

export function albumFromFavorite(data: Omit<FavoriteDoc, 'addedAt'>, catalog: ReadonlyMap<string, Album>): Album {
  const known = catalog.get(data.albumId)
  if (known) return known
  return {
    id: data.albumId,
    source: data.source,
    title: data.title,
    artist: data.artist,
    year: data.year,
    firstReleaseDate: data.firstReleaseDate,
    charts: data.chartYear && data.chartRank ? [{ year: data.chartYear, rank: data.chartRank }] : undefined,
  }
}

export interface FavoritesStore {
  /** En el orden en que se marcaron. */
  list(): Promise<Album[]>
  add(album: Album): Promise<void>
  remove(albumId: string): Promise<void>
}

export function firestoreFavorites(db: Firestore, uid: string, catalog: ReadonlyMap<string, Album>): FavoritesStore {
  const items = collection(db, 'users', uid, 'favorites')
  return {
    async list() {
      const snap = await getDocs(query(items, orderBy('addedAt', 'asc')))
      return snap.docs.map((d) => albumFromFavorite(d.data() as FavoriteDoc, catalog))
    },
    async add(album) {
      await setDoc(doc(items, album.id), { ...toFavoriteDoc(album), addedAt: serverTimestamp() })
    },
    async remove(albumId) {
      await deleteDoc(doc(items, albumId))
    },
  }
}
