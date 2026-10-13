import { isDemoMode } from '@/config/env'
import { DEMO_DISCOVERY } from '@/data/demo/demoCatalog'
import { AlbumCover } from '@/components/album/AlbumCover'
import { AlbumTile } from '@/components/album/AlbumTile'
import { useAlbumDetail } from '@/components/album/albumDetailContext'
import { PlayButton } from '@/components/player/PlayButton'
import { StateMessage } from '@/components/ui/StateMessage'
import type { Album } from '@/types/music'

/**
 * Sección de descubrimiento. Fase 1: selección fija del modo demostración.
 * Se alimentará de MusicBrainz cuando exista la capa de servicios (fase 2).
 */
export function DiscoverySection() {
  const picks = isDemoMode ? DEMO_DISCOVERY : []
  const [featured, ...rest] = picks

  return (
    <section id="descubrir" aria-labelledby="discovery-title" className="mt-10 border-t-2 border-ink pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="discovery-title" className="font-display text-4xl font-medium tracking-tight italic sm:text-5xl">
          Descubrir
        </h2>
        <p className="label-mono text-ink-faint">{isDemoMode ? 'Selección de ejemplo' : 'Recomendaciones'}</p>
      </div>

      {featured ? (
        <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-12">
          <AlbumTile album={featured} className="w-full max-w-md" />
          <ol className="divide-y divide-rule border-y border-rule self-start">
            {rest.map((album, i) => (
              <DiscoveryRow key={album.id} album={album} position={i + 2} />
            ))}
          </ol>
        </div>
      ) : (
        <StateMessage tone="pending" eyebrow="En preparación" title="Aquí aparecerán discos por descubrir" className="mt-8">
          La selección se construirá con datos reales de MusicBrainz a partir de tus estanterías.
        </StateMessage>
      )}
    </section>
  )
}

function DiscoveryRow({ album, position }: { album: Album; position: number }) {
  const { openAlbum } = useAlbumDetail()
  return (
    <li className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => openAlbum(album)}
        className="group grid min-w-0 flex-1 grid-cols-[2rem_4.5rem_1fr] items-center gap-4 py-4 text-left sm:grid-cols-[2.5rem_5.5rem_1fr]"
      >
        <span className="font-display text-2xl text-ink-faint italic">{String(position).padStart(2, '0')}</span>
        <AlbumCover album={album} className="transition-transform duration-300 ease-out-soft group-hover:-rotate-2" />
        <span className="min-w-0">
          <span className="block truncate font-display text-xl leading-tight font-medium transition-colors group-hover:text-signal">
            {album.title}
          </span>
          <span className="block truncate text-ink-soft">{album.artist}</span>
          {album.year && <span className="label-mono mt-1 block text-ink-faint">{album.year}</span>}
        </span>
      </button>
      <PlayButton album={album} />
    </li>
  )
}
