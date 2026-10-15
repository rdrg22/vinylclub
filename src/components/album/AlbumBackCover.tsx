/**
 * Contraportada del disco para la ficha completa: la original de Cover Art Archive si
 * existe; si no, una funda de cartón compuesta con la lista de canciones, el sello y la
 * edición de MusicBrainz. Nada se inventa: lo que no se conoce no se pinta.
 */
import { useState } from 'react'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { formatLength, getAlbumBack, type AlbumBack } from '@/services/albumBack'
import type { Album } from '@/types/music'
import { cn } from '@/utils/cn'

export function AlbumBackCover({ album, className }: { album: Album; className?: string }) {
  const back = useAsyncResource<AlbumBack | null>(album.source === 'musicbrainz' ? `ficha-back|${album.id}` : null, (signal) =>
    getAlbumBack(album, signal),
  )
  const [photoFailed, setPhotoFailed] = useState(false)

  if (back.status === 'loading') {
    return (
      <figure className={cn('grid aspect-square place-items-center bg-[#2a1a0e]', className)}>
        <figcaption className="label-mono animate-pulse text-[#e8c98f]/70">Buscando la contraportada…</figcaption>
      </figure>
    )
  }

  const data = back.status === 'success' ? back.data : null

  if (data?.backImage && !photoFailed) {
    return (
      <figure className={cn('relative', className)}>
        <img
          src={data.backImage}
          alt={`Contraportada de ${album.title}`}
          loading="lazy"
          onError={() => setPhotoFailed(true)}
          className="aspect-square w-full object-cover"
        />
        <figcaption className="label-mono absolute right-2 bottom-2 rounded-sm bg-black/60 px-2 py-1 text-[0.6rem] text-[#f3e4c3]">
          Contraportada original · Cover Art Archive
        </figcaption>
      </figure>
    )
  }

  return <ComposedBack album={album} data={data} className={className} />
}

/** Reverso de cartón con los datos de la edición, como el del disco en la mano. */
function ComposedBack({ album, data, className }: { album: Album; data: AlbumBack | null; className?: string }) {
  const tracks = data?.tracks ?? []
  const edition = [data?.labels.join(' / '), data?.catalogNumbers[0]].filter(Boolean).join(' · ')
  const details = [data?.date, data?.country, data?.format].filter(Boolean).join(' · ')
  // Dos columnas cuando la lista es larga, como en las contraportadas de los LP.
  const twoColumns = tracks.length > 9

  return (
    <figure
      className={cn(
        'relative flex aspect-square flex-col overflow-hidden bg-[#e9dcc0] p-5 text-[#2a1e14] shadow-[inset_0_0_60px_rgb(120_90_50/0.35)] sm:p-6',
        className,
      )}
    >
      <p className="font-display text-xl leading-tight font-semibold italic">{album.title}</p>
      <p className="label-mono mt-0.5 text-[#6b5a45]">{album.artist}</p>

      {tracks.length > 0 ? (
        <ol className={cn('mt-4 min-h-0 flex-1 gap-x-5 overflow-hidden text-[0.8rem] leading-snug', twoColumns && 'columns-2')}>
          {tracks.map((t, i) => (
            <li key={`${t.number}-${i}`} className="flex break-inside-avoid gap-2 py-px">
              <span className="w-6 shrink-0 tabular-nums text-[#8a7458]">{t.number}</span>
              <span className="min-w-0 flex-1 truncate">{t.title}</span>
              {t.length && <span className="shrink-0 tabular-nums text-[#8a7458]">{formatLength(t.length)}</span>}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 flex-1 text-sm text-[#6b5a45]">
          {album.source === 'musicbrainz' ? 'MusicBrainz no tiene la lista de canciones de esta edición.' : 'Disco no localizado en MusicBrainz: sin datos de la edición.'}
        </p>
      )}

      <div className="mt-3 border-t border-[#2a1e14]/25 pt-2">
        {edition && <p className="label-mono truncate text-[0.6rem] text-[#4a3b2a]">{edition}</p>}
        {details && <p className="label-mono truncate text-[0.6rem] text-[#4a3b2a]">{details}</p>}
        <figcaption className="label-mono mt-1 text-[0.55rem] text-[#8a7458]">Reverso compuesto con datos de MusicBrainz</figcaption>
      </div>
    </figure>
  )
}
