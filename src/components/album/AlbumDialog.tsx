import { useEffect, useRef } from 'react'
import { RELEASE_TYPE_LABEL } from '@/config/shelfFilters'
import type { Album } from '@/types/music'
import { SourceNote } from '@/components/ui/SourceNote'
import { AlbumCover } from './AlbumCover'
import { AlbumDemo } from './AlbumDemo'
import { AlbumMetadata } from './AlbumMetadata'
import { FavoriteButton } from '@/components/favorites/FavoriteButton'
import { ListenLinks } from '@/components/listen/ListenLinks'

interface AlbumDialogProps {
  album: Album | null
  onClose: () => void
}

/** Ficha del disco sobre un <dialog> nativo: foco atrapado, Esc y fondo cierran. */
export function AlbumDialog({ album, onClose }: AlbumDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (album && !dialog.open) dialog.showModal()
    if (!album && dialog.open) dialog.close()
  }, [album])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      aria-labelledby="album-dialog-title"
      className="album-dialog m-auto w-[min(56rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain bg-paper p-0 text-ink shadow-[0_30px_80px_-20px_rgb(0_0_0/0.45)]"
    >
      {album && (
        <div className="grid md:grid-cols-2">
          <AlbumCover album={album} eager size={500} className="w-full md:sticky md:top-0 md:self-start" />

          <div className="flex flex-col gap-6 p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <p className="label-mono text-ink-faint">
                {album.releaseType ? RELEASE_TYPE_LABEL[album.releaseType] : 'Lanzamiento'}
                {album.year ? ` · ${album.year}` : ''}
              </p>
              <div className="-mt-1 -mr-2 flex items-center gap-1">
                <FavoriteButton album={album} />
                <button
                  type="button"
                  onClick={onClose}
                  className="label-mono px-2 py-1 text-ink-soft transition-colors hover:text-signal"
                >
                  Cerrar ✕
                </button>
              </div>
            </div>

            <div>
              <h2 id="album-dialog-title" className="font-display text-3xl leading-[1.05] font-medium tracking-tight text-balance md:text-4xl">
                {album.title}
              </h2>
              <p className="mt-2 text-lg text-ink-soft">{album.artist}</p>
            </div>

            <AlbumDemo album={album} />
            <ListenLinks key={album.id} album={album} />

            <AlbumMetadata key={album.id} album={album} />

            <SourceNote source={album.source} className="mt-auto" />
          </div>
        </div>
      )}
    </dialog>
  )
}
