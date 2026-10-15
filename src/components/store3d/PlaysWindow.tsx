/** Ventana de la pizarra del DJ: todo lo que ha sonado en el tocadiscos; al pulsar uno, se coge. */
import { AlbumCover } from '@/components/album/AlbumCover'
import { whenPlayed, type Play } from '@/services/plays/plays'
import type { Album } from '@/types/music'
import { StoreWindow } from './StoreWindow'

interface Props {
  plays: Play[]
  /** Guardado en la cuenta (true) o solo durante la visita (false). */
  saved: boolean
  onPick: (album: Album) => void
  onClose: () => void
}

export function PlaysWindow({ plays, saved, onPick, onClose }: Props) {
  return (
    <StoreWindow
      title="Ha sonado en el plato"
      badge="♫"
      subtitle={`${plays.length === 1 ? '1 disco' : `${plays.length} discos`} · ${saved ? 'guardado en tu cuenta' : 'solo en esta visita'}`}
      footer="Lo apunta el DJ cada vez que pones un disco en el tocadiscos · Esc para cerrar"
      onClose={onClose}
    >
      {plays.length === 0 ? (
        <p className="text-ink-soft">Aún no ha sonado nada. Coge un disco y pulsa «Ponerlo en el tocadiscos».</p>
      ) : (
        <ol className="divide-y divide-rule border-y border-rule">
          {plays.map((play, i) => (
            <li key={`${play.playedAt}-${i}`}>
              <button type="button" onClick={() => onPick(play.album)} className="group flex w-full items-center gap-4 py-3 text-left">
                <AlbumCover album={play.album} className="size-12 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium transition-colors group-hover:text-signal">{play.album.title}</span>
                  <span className="block truncate text-sm text-ink-soft">{play.album.artist}</span>
                </span>
                <span className="label-mono shrink-0 text-ink-faint">{whenPlayed(play.playedAt)}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </StoreWindow>
  )
}
