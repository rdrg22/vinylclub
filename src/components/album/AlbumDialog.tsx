import { useEffect, useRef } from 'react'
import { RELEASE_TYPE_LABEL } from '@/config/shelfFilters'
import type { Album } from '@/types/music'
import { SourceNote } from '@/components/ui/SourceNote'
import { AlbumBackCover } from './AlbumBackCover'
import { AlbumCover } from './AlbumCover'
import { AlbumDemo } from './AlbumDemo'
import { AlbumMetadata } from './AlbumMetadata'
import { FavoriteButton } from '@/components/favorites/FavoriteButton'
import { ListenLinks } from '@/components/listen/ListenLinks'
import { STORE_FRAME, STORE_THEME } from '@/components/ui/storeTheme'

interface AlbumDialogProps {
  album: Album | null
  onClose: () => void
}

/**
 * Ficha completa del disco sobre un <dialog> nativo (foco atrapado, Esc y fondo cierran),
 * vestida como las cartelas de la tienda.
 */
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
      style={STORE_THEME}
      className={`album-dialog m-auto max-h-[calc(100dvh-2rem)] w-[min(56rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain p-0 backdrop:bg-black/55 [scrollbar-color:rgb(232_201_143/0.45)_transparent] [scrollbar-width:thin] ${STORE_FRAME}`}
    >
      {album && (
        <div className="grid md:grid-cols-2">
          {/* Portada y, debajo, la contraportada: la funda entera, por delante y por detrás. */}
          <div className="border-b-2 border-[#e8c98f] md:border-r-2 md:border-b-0">
            <AlbumCover album={album} eager size={500} className="w-full" />
            <AlbumBackCover key={album.id} album={album} className="w-full border-t-2 border-[#e8c98f]" />
          </div>

          <div className="flex flex-col gap-6 p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <p className="label-mono text-ink-faint">
                {album.releaseType ? RELEASE_TYPE_LABEL[album.releaseType] : 'Lanzamiento'}
                {album.year ? ` · ${album.year}` : ''}
              </p>
              <div className="-mt-1 -mr-2 flex items-center gap-1">
                <FavoriteButton album={album} tone="dark" />
                <button
                  type="button"
                  onClick={onClose}
                  className="label-mono rounded-sm border border-[#e8c98f]/50 px-3 py-2 text-[#f3e4c3] transition-colors hover:border-[#e8c98f] hover:bg-[#e8c98f]/10"
                >
                  Cerrar ✕
                </button>
              </div>
            </div>

            <div>
              <h2 id="album-dialog-title" className="font-display text-3xl leading-[1.05] font-semibold tracking-tight text-balance italic md:text-4xl">
                {album.title}
              </h2>
              <p className="mt-2 text-lg text-ink-soft">{album.artist}</p>
            </div>

            <AlbumDemo album={album} />
            <ListenLinks key={album.id} album={album} tone="dark" />

            <AlbumMetadata key={album.id} album={album} />

            <SourceNote source={album.source} className="mt-auto" />
          </div>
        </div>
      )}
    </dialog>
  )
}
