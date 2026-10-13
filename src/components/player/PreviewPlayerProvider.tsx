import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { findAlbumPreview } from '@/services/previews/itunesPreviews'
import type { Album } from '@/types/music'
import { PreviewPlayerContext, type PlayerState } from './previewPlayerContext'

const IDLE: PlayerState = { album: null, preview: null, status: 'idle' }
const TARGET_VOLUME = 0.85
const FADE_MS = 500

/** Un único <audio> para toda la app: solo suena una demo a la vez. */
export function PreviewPlayerProvider({ children }: { children: ReactNode }) {
  const [audio] = useState(() => (typeof Audio === 'undefined' ? null : new Audio()))
  const [state, setState] = useState<PlayerState>(IDLE)
  const stateRef = useRef(state)
  stateRef.current = state
  // Invalida búsquedas antiguas si el usuario pulsa otro disco mientras carga.
  const requestRef = useRef(0)

  useEffect(() => {
    if (!audio) return
    audio.preload = 'none'
    const setStatus = (status: PlayerState['status']) =>
      setState((prev) => (prev.preview && prev.status !== status ? { ...prev, status } : prev))
    const onPlaying = () => setStatus('playing')
    const onPause = () => setStatus('paused')
    const onError = () => setStatus('error')
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onPause)
    audio.addEventListener('error', onError)
    return () => {
      audio.pause()
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onPause)
      audio.removeEventListener('error', onError)
    }
  }, [audio])

  const play = useCallback(async () => {
    if (!audio) return
    audio.volume = 0
    await audio.play()
    // Entrada suave, como bajar la aguja.
    const start = performance.now()
    const fade = (now: number) => {
      const t = Math.min(1, (now - start) / FADE_MS)
      audio.volume = TARGET_VOLUME * t
      if (t < 1 && !audio.paused) requestAnimationFrame(fade)
    }
    requestAnimationFrame(fade)
  }, [audio])

  const stop = useCallback(() => {
    requestRef.current++
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
    setState(IDLE)
  }, [audio])

  const toggle = useCallback(
    async (album: Album) => {
      if (!audio) return
      const current = stateRef.current

      if (current.album?.id === album.id && current.preview) {
        if (audio.paused) play().catch(() => setState((prev) => ({ ...prev, status: 'paused' })))
        else audio.pause()
        return
      }
      if (current.album?.id === album.id && current.status === 'loading') return

      const request = ++requestRef.current
      audio.pause()
      setState({ album, preview: null, status: 'loading' })

      try {
        const preview = await findAlbumPreview(album)
        if (request !== requestRef.current) return
        if (!preview) {
          setState({ album, preview: null, status: 'unavailable' })
          return
        }
        audio.src = preview.previewUrl
        setState({ album, preview, status: 'loading' })
        await play()
      } catch (error) {
        if (request !== requestRef.current) return
        // El navegador puede bloquear el audio si la búsqueda tardó demasiado: queda en pausa, listo para reanudar.
        const blocked = error instanceof DOMException && error.name === 'NotAllowedError'
        setState((prev) => ({ ...prev, album, status: blocked && prev.preview ? 'paused' : 'error' }))
      }
    },
    [audio, play],
  )

  const api = useMemo(() => ({ state, toggle, stop, audio }), [state, toggle, stop, audio])

  return <PreviewPlayerContext.Provider value={api}>{children}</PreviewPlayerContext.Provider>
}
