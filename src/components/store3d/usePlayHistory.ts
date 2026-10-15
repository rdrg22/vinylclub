/**
 * Lo que ha sonado en el tocadiscos: con sesión iniciada se guarda en la cuenta; sin
 * sesión, solo durante la visita.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/authContext'
import { CHART_ALBUMS } from '@/data/charts/chartCatalog'
import { db } from '@/services/firebase'
import { firestorePlays, PLAY_HISTORY, type Play, type PlaysStore } from '@/services/plays/plays'
import type { Album } from '@/types/music'

const CATALOG = new Map(CHART_ALBUMS.map((a) => [a.id, a]))

export function usePlayHistory() {
  const { state } = useAuth()
  const userId = state.status === 'signed-in' ? state.user.id : null
  const store = useMemo<PlaysStore | null>(() => (userId && db ? firestorePlays(db, userId, CATALOG) : null), [userId])
  const [plays, setPlays] = useState<Play[]>([])

  useEffect(() => {
    if (!store) {
      if (state.status === 'signed-out') setPlays([])
      return
    }
    let alive = true
    store
      .list()
      .then((list) => alive && setPlays(list))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [store, state.status])

  const record = useCallback(
    (album: Album) => {
      setPlays((prev) => [{ album, playedAt: new Date().toISOString() }, ...prev].slice(0, PLAY_HISTORY))
      store?.add(album).catch(() => undefined)
    },
    [store],
  )

  return { plays, record }
}
