import { useEffect } from 'react'
import { AlbumCover } from '@/components/album/AlbumCover'
import { useAlbumDetail } from '@/components/album/albumDetailContext'
import { PlayButton } from './PlayButton'
import { useAudioProgress, usePreviewPlayer } from './previewPlayerContext'

const NOTICE_MS = 4000

/** Barra inferior con la demo que suena. Avisa también cuando un disco no tiene demo. */
export function NowPlayingBar() {
  const { state, stop } = usePreviewPlayer()
  const { openAlbum } = useAlbumDetail()
  const { album, preview, status } = state
  const progress = useAudioProgress(status === 'playing' || status === 'paused')
  const notice = status === 'unavailable' || status === 'error'

  // Los avisos de «sin demo» desaparecen solos.
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(stop, NOTICE_MS)
    return () => clearTimeout(timer)
  }, [notice, album, stop])

  if (!album || status === 'idle') return null

  return (
    <div
      role="region"
      aria-label="Reproductor de demos"
      className="fixed inset-x-0 bottom-0 z-40 animate-[bar-in_320ms_var(--ease-out-soft)] border-t border-ink bg-paper/95 backdrop-blur-sm"
    >
      <div aria-hidden className="h-0.5 bg-rule">
        <div className="h-full origin-left bg-signal" style={{ transform: `scaleX(${progress})` }} />
      </div>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:gap-4 sm:px-8">
        <button
          type="button"
          onClick={() => openAlbum(album)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-label={`Abrir ficha de ${album.title}`}
        >
          <AlbumCover album={album} className="size-11 shrink-0" />
          <span className="min-w-0" aria-live="polite">
            <span className="block truncate font-medium">
              {notice
                ? status === 'error'
                  ? 'No se pudo cargar la demo'
                  : 'Este disco no tiene demo disponible'
                : (preview?.trackName ?? 'Buscando una demo…')}
            </span>
            <span className="block truncate text-sm text-ink-soft">
              {album.title} · {album.artist}
            </span>
          </span>
        </button>

        {preview?.storeUrl && (
          <a
            href={preview.storeUrl}
            target="_blank"
            rel="noreferrer"
            className="label-mono hidden text-ink-faint transition-colors hover:text-signal sm:block"
          >
            Demo 30 s · Apple Music ↗
          </a>
        )}
        {!notice && <PlayButton album={album} />}
        <button
          type="button"
          onClick={stop}
          aria-label="Cerrar reproductor"
          className="grid size-9 place-items-center text-ink-soft transition-colors hover:text-signal"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
