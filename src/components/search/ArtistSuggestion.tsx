import { Link } from 'react-router-dom'
import { useArtistSearch } from '@/hooks/useAlbums'
import { comparable } from '@/utils/text'
import { artistSummary } from './ArtistRow'

/**
 * Si la búsqueda coincide exactamente con el nombre de un artista, se ofrece su
 * discografía: MusicBrainz no ordena por popularidad y sus álbumes principales
 * pueden no aparecer los primeros entre los discos. Reutiliza la búsqueda de la
 * pestaña «Artistas» (misma consulta, misma caché).
 */
export function ArtistSuggestion({ query, enabled }: { query: string; enabled: boolean }) {
  // Se pide después de los discos para no retrasar el resultado principal en la cola.
  const artists = useArtistSearch(enabled ? query : '', 1)
  if (artists.status !== 'success') return null

  const target = comparable(query)
  const matches = artists.data.items.filter(
    (artist) => comparable(artist.name) === target || (artist.sortName && comparable(artist.sortName) === target),
  )
  const [artist] = matches
  if (!artist) return null
  const summary = artistSummary(artist)

  return (
    <aside aria-label="Artista coincidente" className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-y-2 border-ink py-5">
      <span aria-hidden className="grid size-14 place-items-center rounded-full bg-ink font-display text-2xl text-paper">
        {artist.name.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="label-mono text-ink-faint">¿Buscabas al artista?</p>
        <p className="font-display text-2xl font-medium">
          {artist.name}
          {artist.disambiguation && <span className="ml-2 text-base font-normal text-ink-faint">({artist.disambiguation})</span>}
        </p>
        {summary && <p className="text-sm text-ink-soft">{summary}</p>}
      </div>
      <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:items-end">
        <Link
          to={`/artista/${artist.id}`}
          className="group inline-flex items-center gap-2 bg-ink px-5 py-3 text-sm font-medium text-paper transition-colors hover:bg-signal"
        >
          Ver su discografía <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
        {matches.length > 1 && (
          <Link
            to={`/buscar?${new URLSearchParams({ q: query, tipo: 'artistas' })}`}
            className="label-mono text-ink-faint hover:text-signal"
          >
            Hay {matches.length} artistas con este nombre
          </Link>
        )}
      </div>
    </aside>
  )
}
