import { PlayButton } from '@/components/player/PlayButton'
import { usePreviewPlayer } from '@/components/player/previewPlayerContext'
import type { Album } from '@/types/music'

/** Bloque «Escuchar demo» de la ficha del disco. */
export function AlbumDemo({ album }: { album: Album }) {
  const { state } = usePreviewPlayer()
  const current = state.album?.id === album.id
  const status = current ? state.status : 'idle'

  const title =
    status === 'loading'
      ? 'Buscando una demo…'
      : status === 'unavailable'
        ? 'Sin demo disponible'
        : status === 'error'
          ? 'No se pudo cargar la demo'
          : current && state.preview
            ? `«${state.preview.trackName}»`
            : 'Escuchar demo'

  const detail =
    status === 'unavailable'
      ? 'No hemos encontrado una pista de este disco con seguridad.'
      : status === 'error'
        ? 'Revisa la conexión e inténtalo de nuevo.'
        : 'Fragmento de 30 s de una pista del disco, vía Apple Music.'

  return (
    <div className="flex items-center gap-4">
      <PlayButton album={album} size="lg" />
      <div className="min-w-0" aria-live="polite">
        <p className="truncate font-medium">{title}</p>
        <p className="text-sm text-ink-soft">
          {detail}
          {current && state.preview?.storeUrl && (
            <>
              {' '}
              <a href={state.preview.storeUrl} target="_blank" rel="noreferrer" className="underline decoration-rule underline-offset-2 hover:text-signal">
                Abrir en Apple Music ↗
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
