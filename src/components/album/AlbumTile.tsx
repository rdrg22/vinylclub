import { PlayButton } from '@/components/player/PlayButton'
import { usePreviewPlayer } from '@/components/player/previewPlayerContext'
import type { Album } from '@/types/music'
import { cn } from '@/utils/cn'
import { AlbumCover } from './AlbumCover'
import { useAlbumDetail } from './albumDetailContext'

/** Puesto en Billboard si el disco viene de la lista; si no, el año de publicación. */
function TileFootnote({ album }: { album: Album }) {
  const chart = album.charts?.[0]
  if (chart) {
    return (
      <span className="label-mono mt-1 flex items-center gap-1.5 text-ink-faint">
        <span className={cn('px-1 py-px', chart.rank === 1 ? 'bg-signal text-paper' : 'bg-paper-deep text-ink-soft')}>
          nº {chart.rank}
        </span>
        {chart.year}
        {album.charts && album.charts.length > 1 && <span title="Estuvo en la lista varios años">+{album.charts.length - 1}</span>}
      </span>
    )
  }
  return album.year ? <span className="label-mono mt-1 block text-ink-faint">{album.year}</span> : null
}

interface AlbumTileProps {
  album: Album
  className?: string
  eager?: boolean
}

/**
 * Funda en la estantería. Al pasar el cursor (o con foco de teclado) el vinilo
 * asoma por arriba, como al sacar un disco de la cubeta. Mientras suena su demo,
 * el vinilo se queda fuera y gira.
 */
export function AlbumTile({ album, className, eager }: AlbumTileProps) {
  const { openAlbum } = useAlbumDetail()
  const { state } = usePreviewPlayer()
  const current = state.album?.id === album.id
  const spinning = current && (state.status === 'playing' || state.status === 'paused' || state.status === 'loading')

  return (
    <div className={cn('group relative', className)}>
      <button
        type="button"
        onClick={() => openAlbum(album)}
        className="block w-full text-left focus-visible:outline-offset-4"
      >
        <span className="relative block">
          <span
            aria-hidden
            className={cn(
              'absolute inset-x-[5%] top-[2%] aspect-square transition-transform duration-500 ease-out-soft',
              spinning
                ? '-translate-y-[22%]'
                : 'group-focus-within:-translate-y-[16%] group-hover:-translate-y-[16%]',
            )}
          >
            <span
              className={cn('vinyl block size-full', spinning && 'vinyl-spin')}
              data-paused={current && state.status !== 'playing'}
            />
          </span>
          <AlbumCover
            album={album}
            eager={eager}
            className="relative shadow-[0_1px_0_rgb(0_0_0/0.08),0_10px_24px_-14px_rgb(0_0_0/0.5)] transition-transform duration-500 ease-out-soft group-hover:translate-y-0.5"
          />
        </span>
        <span className="mt-3 block">
          <span className={cn('line-clamp-1 font-medium leading-snug transition-colors group-hover:text-signal', current && 'text-signal')}>
            {album.title}
          </span>
          <span className="line-clamp-1 text-sm text-ink-soft">{album.artist}</span>
          <TileFootnote album={album} />
        </span>
      </button>

      {/* Capa del tamaño de la portada para colocar el botón de demo en su esquina. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 aspect-square">
        <div
          className={cn(
            'pointer-events-auto absolute right-2 bottom-2 transition-[opacity,scale] duration-300 ease-out-soft',
            !current &&
              'scale-90 opacity-0 group-focus-within:scale-100 group-focus-within:opacity-100 group-hover:scale-100 group-hover:opacity-100 [@media(hover:none)]:scale-100 [@media(hover:none)]:opacity-100',
          )}
        >
          <PlayButton album={album} />
        </div>
      </div>
    </div>
  )
}
