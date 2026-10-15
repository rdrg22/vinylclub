/**
 * Colección personal: las ediciones concretas (releases de MusicBrainz) que tiene cada usuario.
 *
 * Dos almacenes con la misma interfaz:
 * - Firestore, con cuenta: en la nube, protegido por las reglas (cada uno solo ve lo suyo).
 * - Local, en modo demostración (sin Firebase configurado): solo en este navegador.
 */
import { collection, deleteDoc, deleteField, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, type Firestore } from 'firebase/firestore'
import type { Album, Release } from '@/types/music'
import { yearOf } from '@/services/musicbrainz/normalize'

export interface CollectionItem {
  /** Id del registro (en Firestore, el MBID de la edición). */
  id: string
  /** MBID de la edición. */
  releaseId: string
  /** MBID del disco (release group): portada y ficha. */
  albumId: string
  title: string
  artist: string
  /** Fecha de la edición (YYYY, YYYY-MM o YYYY-MM-DD). */
  date?: string
  country?: string
  formats: string[]
  labels: string[]
  barcode?: string
  addedAt: string
  /** Lo que le costó al usuario, en euros (opcional, lo escribe él). */
  price?: number
  /** Nota libre del usuario (estado, dónde lo compró…). */
  note?: string
}

/** Lo que el usuario puede cambiar de un disco de su colección. `null` lo borra. */
export interface ItemNotes {
  price?: number | null
  note?: string | null
}

export const MAX_PRICE = 100000
export const MAX_NOTE = 500

/** Precio escrito por el usuario («24,99», «24.99 €», «24») → euros con 2 decimales; null si no vale. */
export function parsePrice(input: string): number | null {
  const clean = input.replace(/[€\s]/g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null
  const value = Math.round(Number(clean) * 100) / 100
  return value <= MAX_PRICE ? value : null
}

const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
export const formatPrice = (value: number) => euros.format(value)

export interface CollectionStore {
  list(): Promise<CollectionItem[]>
  add(release: Release): Promise<CollectionItem>
  remove(id: string): Promise<void>
  /** Cambiar el precio y la nota del usuario. */
  update(id: string, notes: ItemNotes): Promise<void>
}

export class CollectionError extends Error {
  readonly code: 'duplicate' | 'not-signed-in' | 'unknown'
  constructor(message: string, code: CollectionError['code'] = 'unknown') {
    super(message)
    this.code = code
  }
}

const DATE = /^\d{4}(-\d{2}){0,2}$/

/** Datos que se guardan de una edición de MusicBrainz. */
export function itemFromRelease(release: Release): Omit<CollectionItem, 'id' | 'addedAt'> {
  return {
    releaseId: release.id,
    albumId: release.album.id,
    title: release.title,
    artist: release.artist || release.album.artist,
    date: release.date && DATE.test(release.date) ? release.date : undefined,
    country: release.country,
    formats: release.formats,
    labels: release.labels,
    barcode: release.barcode && /^\d{1,20}$/.test(release.barcode) ? release.barcode : undefined,
  }
}

/** El disco al que pertenece la edición, para la portada y la ficha. */
export function albumOf(item: CollectionItem): Album {
  return {
    id: item.albumId,
    source: 'musicbrainz',
    title: item.title,
    artist: item.artist,
    firstReleaseDate: item.date,
    year: yearOf(item.date),
  }
}

/** ¿Es un vinilo? (12", 7", 10", «Vinyl»…) */
export const isVinyl = (formats: string[]) => formats.some((f) => /vinyl/i.test(f))

// ---------------------------------------------------------------- Firestore

/** Documento de users/{uid}/collection/{releaseId}, tal como lo validan las reglas. */
export interface CollectionDoc {
  releaseId: string
  albumId: string
  title: string
  artist: string
  date?: string
  country?: string
  formats: string[]
  labels: string[]
  barcode?: string
  /** Timestamp de Firestore (null un instante, mientras el servidor lo pone). */
  addedAt: { toDate(): Date } | null
  price?: number
  note?: string
}

export function fromDoc(id: string, data: CollectionDoc): CollectionItem {
  return {
    id,
    releaseId: data.releaseId,
    albumId: data.albumId,
    title: data.title,
    artist: data.artist,
    date: data.date,
    country: data.country,
    formats: data.formats ?? [],
    labels: data.labels ?? [],
    barcode: data.barcode,
    addedAt: (data.addedAt?.toDate() ?? new Date()).toISOString(),
    price: typeof data.price === 'number' ? data.price : undefined,
    note: data.note || undefined,
  }
}

/** Firestore no admite `undefined`: los campos vacíos simplemente no se escriben. */
export function toDocData(release: Release): Omit<CollectionDoc, 'addedAt'> {
  const item = itemFromRelease(release)
  const data: Omit<CollectionDoc, 'addedAt'> = {
    releaseId: item.releaseId,
    albumId: item.albumId,
    title: item.title.slice(0, 500),
    artist: (item.artist || 'Artista desconocido').slice(0, 500),
    formats: item.formats.slice(0, 20),
    labels: item.labels.slice(0, 20),
  }
  if (item.date) data.date = item.date
  if (item.country && item.country.length <= 10) data.country = item.country
  if (item.barcode) data.barcode = item.barcode
  return data
}

export function firestoreCollection(db: Firestore, uid: string): CollectionStore {
  const items = collection(db, 'users', uid, 'collection')
  return {
    async list() {
      try {
        const snap = await getDocs(query(items, orderBy('addedAt', 'desc')))
        return snap.docs.map((d) => fromDoc(d.id, d.data() as CollectionDoc))
      } catch {
        throw new CollectionError('No se pudo cargar tu colección.')
      }
    },
    async add(release) {
      const ref = doc(items, release.id)
      try {
        if ((await getDoc(ref)).exists()) throw new CollectionError('Esta edición ya está en tu colección.', 'duplicate')
        await setDoc(ref, { ...toDocData(release), addedAt: serverTimestamp() })
        return fromDoc(ref.id, { ...toDocData(release), addedAt: null })
      } catch (error) {
        if (error instanceof CollectionError) throw error
        throw new CollectionError('No se pudo añadir el disco. Inténtalo de nuevo.')
      }
    },
    async remove(id) {
      try {
        await deleteDoc(doc(items, id))
      } catch {
        throw new CollectionError('No se pudo quitar el disco.')
      }
    },
    async update(id, notes) {
      const changes: Record<string, unknown> = {}
      if (notes.price !== undefined) changes.price = notes.price === null ? deleteField() : notes.price
      if (notes.note !== undefined) changes.note = notes.note ? notes.note.slice(0, MAX_NOTE) : deleteField()
      try {
        await updateDoc(doc(items, id), changes)
      } catch {
        throw new CollectionError('No se pudo guardar. Inténtalo de nuevo.')
      }
    },
  }
}

// ---------------------------------------------------------------- local (modo demostración)

const LOCAL_KEY = 'vinylclub:demo-collection'

function readLocal(storage: Storage): CollectionItem[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(LOCAL_KEY) ?? '[]')
    return Array.isArray(parsed) ? (parsed as CollectionItem[]) : []
  } catch {
    return []
  }
}

export function localCollection(storage: Storage = window.localStorage): CollectionStore {
  const write = (items: CollectionItem[]) => {
    try {
      storage.setItem(LOCAL_KEY, JSON.stringify(items))
    } catch {
      throw new CollectionError('Este navegador no deja guardar datos.')
    }
  }
  return {
    async list() {
      return readLocal(storage)
    },
    async add(release) {
      const items = readLocal(storage)
      if (items.some((i) => i.releaseId === release.id)) {
        throw new CollectionError('Esta edición ya está en tu colección.', 'duplicate')
      }
      const item: CollectionItem = { ...itemFromRelease(release), id: crypto.randomUUID(), addedAt: new Date().toISOString() }
      write([item, ...items])
      return item
    },
    async remove(id) {
      write(readLocal(storage).filter((i) => i.id !== id))
    },
    async update(id, notes) {
      write(
        readLocal(storage).map((i) => {
          if (i.id !== id) return i
          const next = { ...i }
          if (notes.price !== undefined) next.price = notes.price ?? undefined
          if (notes.note !== undefined) next.note = notes.note?.slice(0, MAX_NOTE) || undefined
          return next
        }),
      )
    },
  }
}
