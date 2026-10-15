import { useState } from 'react'
import { useCollection } from '@/components/collection/collectionContext'
import { FavoriteButton } from '@/components/favorites/FavoriteButton'
import { ListenLinks } from '@/components/listen/ListenLinks'
import { PlayButton } from '@/components/player/PlayButton'
import { usePreviewPlayer } from '@/components/player/previewPlayerContext'
import type { Album } from '@/types/music'
import { cn } from '@/utils/cn'
import { describeReleaseTypes } from '@/utils/releaseTypes'

interface HeldPanelProps {
  album: Album
  flipped: boolean
  /** De dónde sale lo que se ve en el reverso. */
  backNote: string
  onFlip: () => void
  onReturn: () => void
  onTurntable: () => void
  onDetails: () => void
}

const button =
  'label-mono rounded-sm border border-[#e8c98f]/50 px-3 py-2 text-[#f3e4c3] transition-colors hover:border-[#e8c98f] hover:bg-[#e8c98f]/10'

/** Cartela del disco que se tiene en la mano, con el estilo de los carteles de la tienda. */
export function HeldPanel({ album, flipped, backNote, onFlip, onReturn, onTurntable, onDetails }: HeldPanelProps) {
  const { state } = usePreviewPlayer()
  const collection = useCollection()
  // Ediciones de este disco en tu colección (normalmente una).
  const owned = collection.items.filter((i) => i.albumId === album.id)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const current = state.album?.id === album.id
  const status = current ? state.status : 'idle'
  const chart = album.charts?.[0]
  const types = describeReleaseTypes(album)

  const demoText =
    status === 'loading'
      ? 'Buscando una demo…'
      : status === 'unavailable'
        ? 'Este disco no tiene demo'
        : status === 'error'
          ? 'No se pudo cargar la demo'
          : current && state.preview
            ? `«${state.preview.trackName}»`
            : 'Escuchar una canción'

  return (
    <section
      data-hud
      aria-label={`${album.title}, de ${album.artist}`}
      className="pointer-events-auto mx-auto w-full max-w-3xl animate-[bar-in_420ms_var(--ease-out-soft)] rounded-sm border-2 border-[#e8c98f] bg-[#3e2716]/95 p-4 text-[#f3e4c3] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.85)] backdrop-blur-sm sm:p-5"
    >
      <div className="flex items-start gap-4">
        {chart && (
          <span
            className="grid size-16 shrink-0 -rotate-6 place-items-center rounded-full bg-signal text-center leading-none text-paper shadow-md sm:size-[4.5rem]"
            title="Puesto en la lista anual de álbumes de Billboard"
          >
            <span>
              <span className="block font-display text-2xl font-semibold">nº{chart.rank}</span>
              <span className="label-mono block text-[0.6rem]">{chart.year}</span>
            </span>
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 font-display text-2xl leading-tight font-semibold text-balance italic sm:text-3xl">{album.title}</h2>
          <p className="truncate text-[#f3e4c3]/85">{album.artist}</p>
          <p className="label-mono mt-1 text-[#e8c98f]/80">
            {[album.year, types].filter(Boolean).join(' · ') || 'Disco de la lista de Billboard'}
          </p>
        </div>
        <FavoriteButton album={album} tone="dark" />
        <button type="button" onClick={onReturn} className={cn(button, 'shrink-0')} aria-keyshortcuts="Escape">
          Devolver <span aria-hidden>✕</span>
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-[#e8c98f]/25 pt-4">
        <div className="flex min-w-[15rem] flex-1 items-center gap-3">
          <PlayButton album={album} size="lg" />
          <div className="min-w-0" aria-live="polite">
            <p className="truncate font-medium">{demoText}</p>
            <p className="label-mono text-[#e8c98f]/70">Demo de 30 s · Apple Music</p>
          </div>
        </div>
        <ListenLinks album={album} tone="dark" className="max-w-full" />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e8c98f]/25 pt-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onFlip} className={button} aria-keyshortcuts="F" aria-pressed={flipped}>
            <span aria-hidden>↻</span> {flipped ? 'Ver la portada' : 'Dar la vuelta'}
          </button>
          <button type="button" onClick={onTurntable} className={cn(button, 'border-signal bg-signal/90 hover:bg-signal')}>
            Ponerlo en el tocadiscos
          </button>
          <button type="button" onClick={onDetails} className={button}>
            Ficha completa
          </button>
          {owned.length > 0 &&
            (confirmRemove ? (
              <button
                type="button"
                onClick={async () => {
                  let error: string | null = null
                  for (const item of owned) error = (await collection.remove(item.id)) ?? error
                  setRemoveError(error)
                  if (!error) onReturn()
                }}
                className={cn(button, 'border-signal text-[#ff8a6b]')}
              >
                ¿Seguro? Quitar
              </button>
            ) : (
              <button type="button" onClick={() => setConfirmRemove(true)} className={button}>
                Quitar de mi colección
              </button>
            ))}
          {removeError && <p className="label-mono self-center text-[#ff8a6b]">{removeError}</p>}
        </div>
        <p className="label-mono max-w-xs text-right text-[0.6rem] text-[#f3e4c3]/55">
          Arrastra para girarlo
          <span className="[@media(hover:none)]:hidden"> · F para darle la vuelta · Esc para devolverlo</span>
          <span className="block">{backNote}</span>
        </p>
      </div>
    </section>
  )
}
