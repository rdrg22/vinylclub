/**
 * Colección del usuario: con cuenta, en Firestore; en modo demostración, en este navegador.
 * Se carga al iniciar sesión y se vacía al cerrarla.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@/components/auth/authContext'
import { CollectionError, firestoreCollection, localCollection, type CollectionItem, type CollectionStore } from '@/services/collection/collection'
import { db } from '@/services/firebase'
import { CollectionContext, type CollectionApi } from './collectionContext'

const message = (error: unknown) => (error instanceof CollectionError ? error.message : 'Algo ha fallado. Inténtalo de nuevo.')

export function CollectionProvider({ children }: { children: ReactNode }) {
  const { state } = useAuth()
  const userId = state.status === 'signed-in' ? state.user.id : null

  // Un almacén por usuario: al cambiar de cuenta no se mezclan colecciones.
  const store = useMemo<CollectionStore | null>(() => {
    if (state.status === 'demo') return localCollection()
    if (userId && db) return firestoreCollection(db, userId)
    return null
  }, [state.status, userId])

  const [items, setItems] = useState<CollectionItem[]>([])
  const [status, setStatus] = useState<CollectionApi['status']>('off')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!store) {
      setItems([])
      setStatus('off')
      return
    }
    let alive = true
    setStatus('loading')
    store
      .list()
      .then((list) => {
        if (!alive) return
        setItems(list)
        setStatus('ready')
      })
      .catch(() => alive && setStatus('error'))
    return () => {
      alive = false
    }
  }, [store, attempt])

  const has = useCallback((releaseId: string) => items.some((i) => i.releaseId === releaseId), [items])

  const api = useMemo<CollectionApi>(
    () => ({
      status,
      where: state.status === 'demo' ? 'browser' : 'account',
      items,
      has,
      async add(release) {
        if (!store) return 'Entra en tu cuenta para guardar discos.'
        try {
          const item = await store.add(release)
          setItems((prev) => [item, ...prev])
          return null
        } catch (error) {
          return message(error)
        }
      },
      async remove(id) {
        if (!store) return 'Entra en tu cuenta.'
        try {
          await store.remove(id)
          setItems((prev) => prev.filter((i) => i.id !== id))
          return null
        } catch (error) {
          return message(error)
        }
      },
      async update(id, notes) {
        if (!store) return 'Entra en tu cuenta.'
        try {
          await store.update(id, notes)
          setItems((prev) =>
            prev.map((i) =>
              i.id !== id
                ? i
                : {
                    ...i,
                    ...(notes.price !== undefined && { price: notes.price ?? undefined }),
                    ...(notes.note !== undefined && { note: notes.note || undefined }),
                  },
            ),
          )
          return null
        } catch (error) {
          return message(error)
        }
      },
      reload: () => setAttempt((n) => n + 1),
    }),
    [status, state.status, items, has, store],
  )

  return <CollectionContext.Provider value={api}>{children}</CollectionContext.Provider>
}
