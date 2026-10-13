import { Link, useParams } from 'react-router-dom'
import { AlbumGrid } from '@/components/album/AlbumGrid'
import { artistSummary } from '@/components/search/ArtistRow'
import { buttonClass } from '@/components/ui/buttonStyles'
import { LoadError } from '@/components/ui/LoadError'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination, usePageParam } from '@/components/ui/Pagination'
import { AlbumGridSkeleton } from '@/components/ui/Skeletons'
import { StateMessage } from '@/components/ui/StateMessage'
import { useArtist, useArtistAlbums } from '@/hooks/useAlbums'
import { HttpError } from '@/services/http'
import type { Album } from '@/types/music'
import { formatCount } from '@/utils/format'

/** Agrupa como una tienda: primero los álbumes «de verdad», luego EP y el resto. */
function groupDiscography(albums: Album[]) {
  const plain = (album: Album) => !album.secondaryTypes?.length
  const groups = [
    { title: 'Álbumes', albums: albums.filter((a) => a.primaryType === 'Album' && plain(a)) },
    { title: 'EP', albums: albums.filter((a) => a.primaryType === 'EP' && plain(a)) },
    { title: 'Directos, recopilatorios y otros', albums: albums.filter((a) => !plain(a)) },
  ]
  return groups.filter((group) => group.albums.length > 0)
}

/** Ficha de artista con su discografía oficial (álbumes y EP) desde MusicBrainz. */
export function ArtistPage() {
  const { artistId } = useParams()
  const page = usePageParam()
  const artist = useArtist(artistId)
  const albums = useArtistAlbums(artistId, page)

  if (artist.status === 'error') {
    const notFound = artist.error instanceof HttpError && (artist.error.status === 404 || artist.error.status === 400)
    return notFound ? (
      <StateMessage
        eyebrow="Artista no encontrado"
        title="MusicBrainz no tiene este artista"
        headingLevel="h1"
        action={<Link to="/buscar" className={buttonClass('quiet')}>Volver a buscar</Link>}
        className="mt-14"
      />
    ) : (
      <LoadError error={artist.error} onRetry={artist.retry} className="mt-14" />
    )
  }

  const info = artist.status === 'success' ? artist.data : null

  return (
    <>
      <PageHeader eyebrow="Artista · MusicBrainz" title={info?.name ?? 'Cargando…'}>
        {info && (
          <>
            {info.disambiguation && <p className="italic">{info.disambiguation}</p>}
            {artistSummary(info) && <p className="label-mono mt-2">{artistSummary(info)}</p>}
            {info.tags && info.tags.length > 0 && (
              <p className="label-mono mt-1 text-ink-faint">Etiquetas de la comunidad: {info.tags.join(' · ')}</p>
            )}
          </>
        )}
      </PageHeader>

      <section aria-labelledby="discography-title" className="border-t-2 border-ink pt-6">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="discography-title" className="font-display text-3xl font-medium tracking-tight italic">
            Discografía
          </h2>
          {albums.status === 'success' && (
            <p className="label-mono text-ink-faint">{formatCount(albums.data.total)} álbumes y EP · por fecha de publicación</p>
          )}
        </div>

        {albums.status === 'error' ? (
          <LoadError error={albums.error} onRetry={albums.retry} />
        ) : albums.status !== 'success' ? (
          <AlbumGridSkeleton />
        ) : albums.data.items.length === 0 ? (
          <StateMessage eyebrow="Sin discos" title="MusicBrainz no tiene álbumes ni EP de este artista" />
        ) : (
          <>
            {groupDiscography(albums.data.items).map((group) => (
              <div key={group.title} className="mb-14">
                <h3 className="label-mono mb-5 flex items-center gap-3 text-ink-soft">
                  {group.title}
                  <span className="text-ink-faint">{group.albums.length}</span>
                  <span aria-hidden className="h-px flex-1 bg-rule" />
                </h3>
                <AlbumGrid albums={group.albums} label={group.title} />
              </div>
            ))}
            <Pagination page={page} data={albums.data} className="mt-4" />
          </>
        )}
      </section>
    </>
  )
}
