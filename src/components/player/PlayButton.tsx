import type { Album } from '@/types/music'
import { cn } from '@/utils/cn'
import { useAudioProgress, usePreviewPlayer, type PlayerStatus } from './previewPlayerContext'

interface PlayButtonProps {
  album: Album
  size?: 'sm' | 'lg'
  className?: string
}

const LABEL: Record<PlayerStatus, string> = {
  idle: 'Escuchar demo de',
  loading: 'Cargando demo de',
  playing: 'Pausar demo de',
  paused: 'Reanudar demo de',
  unavailable: 'No hay demo disponible de',
  error: 'No se pudo cargar la demo de',
}

/** Botón redondo de demo con anillo de progreso. */
export function PlayButton({ album, size = 'sm', className }: PlayButtonProps) {
  const { state, toggle } = usePreviewPlayer()
  const status: PlayerStatus = state.album?.id === album.id ? state.status : 'idle'
  const progress = useAudioProgress(status === 'playing' || status === 'paused')
  const unplayable = status === 'unavailable' || status === 'error'

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        toggle(album)
      }}
      aria-label={`${LABEL[status]} ${album.title}`}
      title={unplayable ? (status === 'error' ? 'No se pudo cargar la demo' : 'Sin demo disponible') : undefined}
      data-status={status}
      className={cn(
        'relative grid shrink-0 place-items-center rounded-full shadow-[0_6px_16px_-6px_rgb(0_0_0/0.6)] transition-[background-color,transform,opacity] duration-300 ease-out-soft active:scale-95',
        size === 'sm' ? 'size-10' : 'size-14',
        unplayable ? 'bg-paper-deep text-ink-faint' : 'bg-ink text-paper hover:bg-signal',
        className,
      )}
    >
      {(status === 'playing' || status === 'paused') && (
        <svg aria-hidden viewBox="0 0 40 40" className="absolute inset-0 size-full -rotate-90">
          <circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
          <circle
            cx="20"
            cy="20"
            r="18.5"
            fill="none"
            stroke="var(--color-signal)"
            strokeWidth="2"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - progress}
          />
        </svg>
      )}
      <Icon status={status} large={size === 'lg'} />
    </button>
  )
}

function Icon({ status, large }: { status: PlayerStatus; large: boolean }) {
  const cls = large ? 'size-5' : 'size-3.5'
  switch (status) {
    case 'loading':
      return <span aria-hidden className={cn(cls, 'animate-spin rounded-full border-2 border-current border-t-transparent')} />
    case 'playing':
      return (
        <svg aria-hidden viewBox="0 0 16 16" className={cls} fill="currentColor">
          <rect x="3" y="2" width="3.5" height="12" rx="0.5" />
          <rect x="9.5" y="2" width="3.5" height="12" rx="0.5" />
        </svg>
      )
    case 'unavailable':
    case 'error':
      return (
        <svg aria-hidden viewBox="0 0 16 16" className={cls} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M6 12.5a2 2 0 1 1-2-2 2 2 0 0 1 2 2Zm0 0V3l7-1.5v8" />
          <path d="M1.5 1.5 14.5 14.5" />
        </svg>
      )
    default:
      return (
        <svg aria-hidden viewBox="0 0 16 16" className={cn(cls, 'translate-x-px')} fill="currentColor">
          <path d="M4 2.2v11.6a.6.6 0 0 0 .9.5l9.2-5.8a.6.6 0 0 0 0-1L4.9 1.7a.6.6 0 0 0-.9.5Z" />
        </svg>
      )
  }
}
