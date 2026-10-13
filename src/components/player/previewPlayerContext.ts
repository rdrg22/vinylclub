import { createContext, useContext, useEffect, useState } from 'react'
import type { Album, AlbumPreview } from '@/types/music'

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'unavailable' | 'error'

export interface PlayerState {
  album: Album | null
  preview: AlbumPreview | null
  status: PlayerStatus
}

export interface PreviewPlayerApi {
  state: PlayerState
  /** Reproduce la demo del disco, o la pausa/reanuda si ya es el disco actual. */
  toggle: (album: Album) => void
  stop: () => void
  audio: HTMLAudioElement | null
}

export const PreviewPlayerContext = createContext<PreviewPlayerApi | null>(null)

export function usePreviewPlayer(): PreviewPlayerApi {
  const ctx = useContext(PreviewPlayerContext)
  if (!ctx) throw new Error('usePreviewPlayer debe usarse dentro de <PreviewPlayerProvider>')
  return ctx
}

/** Progreso 0–1 de la demo. Solo se suscribe a cada fotograma mientras `active`. */
export function useAudioProgress(active: boolean): number {
  const { audio } = usePreviewPlayer()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!active || !audio) return
    let frame = 0
    const tick = () => {
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0)
      frame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(frame)
  }, [active, audio])

  return active ? progress : 0
}
