import { useState } from 'react'
import { coverUrlFor, markCoverMissing, type CoverSize } from '@/services/coverArt'
import type { Album } from '@/types/music'
import { cn } from '@/utils/cn'
import { CoverPlaceholder } from './CoverPlaceholder'

interface AlbumCoverProps {
  album: Album
  className?: string
  /** Las portadas visibles al cargar pueden pedirse sin `lazy`. */
  eager?: boolean
  size?: CoverSize
}

type LoadState = 'loading' | 'loaded' | 'failed'

/**
 * Portada cuadrada. El placeholder está siempre debajo: la imagen real aparece
 * encima con un fundido solo cuando ha cargado, y si no existe no se ve ningún hueco roto.
 */
export function AlbumCover({ album, className, eager = false, size = 250 }: AlbumCoverProps) {
  const src = coverUrlFor(album, size)
  const [state, setState] = useState<{ src?: string; load: LoadState }>({ src, load: 'loading' })
  // Si cambia el disco (o el tamaño), se reinicia el estado de carga.
  const load = state.src === src ? state.load : 'loading'
  if (state.src !== src) setState({ src, load: 'loading' })

  return (
    <div className={cn('relative aspect-square overflow-hidden bg-paper-deep', className)}>
      {/* Mientras haya imagen candidata, el placeholder es decorativo: el texto alternativo lo da <img>. */}
      <CoverPlaceholder album={album} decorative={!!src && load !== 'failed'} />
      {src && load !== 'failed' && (
        <img
          src={src}
          alt={`Portada de ${album.title}, de ${album.artist}`}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setState({ src, load: 'loaded' })}
          onError={() => {
            markCoverMissing(album.id)
            setState({ src, load: 'failed' })
          }}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out',
            load === 'loaded' ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}
    </div>
  )
}
