import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { chartSourceUrl } from '@/data/charts/chartCatalog'
import { useAlbumDetails } from '@/hooks/useAlbums'
import { describeMusicBrainzError } from '@/services/musicbrainz/client'
import type { Album } from '@/types/music'
import { countryName, formatCount, formatPartialDate } from '@/utils/format'
import { describeReleaseTypes } from '@/utils/releaseTypes'

const MAX_EDITIONS = 5

/**
 * Metadatos del disco en su ficha. Lo que ya trae la búsqueda se muestra al momento;
 * géneros oficiales y ediciones se piden a MusicBrainz solo al abrir la ficha.
 */
export function AlbumMetadata({ album }: { album: Album }) {
  const fromMusicBrainz = album.source === 'musicbrainz'
  const details = useAlbumDetails(fromMusicBrainz ? album.id : null)
  const full = details.status === 'success' ? details.data : null
  const tags = full?.album.tags?.length ? full.album.tags : album.tags
  const types = describeReleaseTypes(full?.album ?? album)
  const date = formatPartialDate(full?.album.firstReleaseDate ?? album.firstReleaseDate) ?? album.year?.toString()

  return (
    <div className="border-t border-rule pt-5 text-sm">
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5">
        {album.charts && album.charts.length > 0 && (
          <Row label="Billboard">
            {album.charts.map((chart, i) => (
              <span key={chart.year}>
                {i > 0 && ' · '}
                <a
                  href={chartSourceUrl(chart.year)}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-rule underline-offset-2 hover:text-signal"
                >
                  nº {chart.rank} en {chart.year}
                </a>
              </span>
            ))}
            <span className="block text-ink-faint">Lista anual de álbumes más vendidos en EE. UU.</span>
          </Row>
        )}
        <Row label="Publicación">{date ?? <Missing>Sin fecha en la fuente</Missing>}</Row>
        {types && <Row label="Tipo">{types}</Row>}
        {album.artists && album.artists.length > 0 && (
          <Row label={album.artists.length > 1 ? 'Artistas' : 'Artista'}>
            {album.artists.map((artist, i) => (
              <span key={artist.id}>
                {i > 0 && ', '}
                <Link to={`/artista/${artist.id}`} className="underline decoration-rule underline-offset-2 hover:text-signal">
                  {artist.name}
                </Link>
              </span>
            ))}
          </Row>
        )}
        {album.disambiguation && <Row label="Nota">{album.disambiguation}</Row>}
        {fromMusicBrainz && (
          <Row label="Géneros">
            {full ? full.genres.length ? full.genres.join(', ') : <Missing>Sin géneros asignados en MusicBrainz</Missing> : <Pending />}
          </Row>
        )}
        {tags && tags.length > 0 && (
          <Row label="Etiquetas">
            {tags.join(', ')} <span className="text-ink-faint">· de la comunidad, no verificadas</span>
          </Row>
        )}
        {fromMusicBrainz && full && full.releases.length > 0 && (
          <Row label="Ediciones">
            <p>
              {album.releaseCount
                ? formatCount(album.releaseCount)
                : full.releasesTruncated
                  ? `${formatCount(full.releases.length)} o más`
                  : formatCount(full.releases.length)}{' '}
              en MusicBrainz
              {full.releasesTruncated && <span className="text-ink-faint"> · muestra parcial</span>}
            </p>
            <ul className="mt-1.5 space-y-1 text-ink-soft">
              {full.releases.slice(0, MAX_EDITIONS).map((release) => (
                <li key={release.id} className="truncate">
                  <span className="font-mono text-xs">{formatPartialDate(release.date) ?? 's. f.'}</span>
                  {release.country && ` · ${countryName(release.country)}`}
                  {release.title !== album.title && ` · ${release.title}`}
                </li>
              ))}
            </ul>
          </Row>
        )}
      </dl>

      {details.status === 'error' && (
        <p role="alert" className="mt-4 text-signal">
          {describeMusicBrainzError(details.error)}{' '}
          <button type="button" onClick={details.retry} className="underline underline-offset-2">
            Reintentar
          </button>
        </p>
      )}

      {fromMusicBrainz && (
        <p className="label-mono mt-5 flex flex-wrap gap-x-3 gap-y-1 text-ink-faint">
          <span className="break-all">
            MBID <span className="normal-case">{album.id}</span>
          </span>
          <a
            href={`https://musicbrainz.org/release-group/${album.id}`}
            target="_blank"
            rel="noreferrer"
            className="text-ink-soft hover:text-signal"
          >
            Ver en MusicBrainz ↗
          </a>
        </p>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="label-mono pt-0.5 text-ink-faint">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </>
  )
}

const Missing = ({ children }: { children: ReactNode }) => <span className="text-ink-faint italic">{children}</span>

const Pending = () => (
  <span className="inline-block h-3.5 w-32 animate-pulse bg-paper-deep align-middle" aria-label="Cargando" />
)
