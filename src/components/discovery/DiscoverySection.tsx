import { CHART_ALBUMS } from '@/data/charts/chartCatalog'
import { AlbumCover } from '@/components/album/AlbumCover'
import { AlbumTile } from '@/components/album/AlbumTile'
import { useAlbumDetail } from '@/components/album/albumDetailContext'
import { PlayButton } from '@/components/player/PlayButton'
import { StateMessage } from '@/components/ui/StateMessage'
import type { Album } from '@/types/music'
import { hashString } from '@/utils/hash'

const PICKS = 4

/**
 * Selección del día: 4 discos al azar del catálogo (solo los localizados en
 * MusicBrainz, que tienen portada y ficha). Cambia cada día y es igual para todos;
 * no es una recomendación personalizada.
 */
function dailyPicks(day: string): Album[] {
  const pool = CHART_ALBUMS.filter((album) => album.source === 'musicbrainz')
  const picks: Album[] = []
  for (let i = 0; picks.length < Math.min(PICKS, pool.length); i++) {
    const candidate = pool[hashString(`${day}#${i}`) % pool.length]
    if (candidate && !picks.includes(candidate)) picks.push(candidate)
  }
  return picks
}

export function DiscoverySection() {
  const [featured, ...rest] = dailyPicks(new Date().toISOString().slice(0, 10))

  return (
    <section id="descubrir" aria-labelledby="discovery-title" className="mt-10 border-t-2 border-ink pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="discovery-title" className="font-display text-4xl font-medium tracking-tight italic sm:text-5xl">
          Descubrir
        </h2>
        <p className="label-mono text-ink-faint">Selección del día · al azar entre los Top 10 de Billboard</p>
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
        <StateMessage tone="pending" eyebrow="Sin catálogo" title="Aquí aparecerán discos por descubrir" className="mt-8">
          El catálogo de la tienda todavía no se ha generado.
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
