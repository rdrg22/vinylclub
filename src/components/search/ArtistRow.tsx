import { Link } from 'react-router-dom'
import type { Artist } from '@/types/music'
import { countryName } from '@/utils/format'

const ARTIST_TYPE: Record<string, string> = {
  Person: 'Artista',
  Group: 'Grupo',
  Orchestra: 'Orquesta',
  Choir: 'Coro',
  Character: 'Personaje',
}

/** Resumen de una línea: tipo, origen y años de actividad, solo con los datos que existen. */
export function artistSummary(artist: Artist): string {
  const parts = [
    artist.type ? (ARTIST_TYPE[artist.type] ?? artist.type) : undefined,
    artist.area ?? countryName(artist.country),
    artist.begin ? `${artist.begin.slice(0, 4)}${artist.end ? `–${artist.end.slice(0, 4)}` : ''}` : undefined,
  ]
  return parts.filter(Boolean).join(' · ')
}

export function ArtistRow({ artist }: { artist: Artist }) {
  const summary = artistSummary(artist)
  return (
    <li>
      <Link to={`/artista/${artist.id}`} className="group flex items-center gap-4 py-4">
        <span
          aria-hidden
          className="grid size-14 shrink-0 place-items-center rounded-full bg-ink font-display text-2xl text-paper transition-colors group-hover:bg-signal"
        >
          {artist.name.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-xl font-medium transition-colors group-hover:text-signal">
            {artist.name}
            {artist.disambiguation && <span className="ml-2 text-base font-normal text-ink-faint">({artist.disambiguation})</span>}
          </span>
          {summary && <span className="block truncate text-sm text-ink-soft">{summary}</span>}
          {artist.tags && artist.tags.length > 0 && (
            <span className="label-mono mt-1 block truncate text-ink-faint">{artist.tags.join(' · ')}</span>
          )}
        </span>
        <span aria-hidden className="text-xl transition-transform group-hover:translate-x-1">
          →
        </span>
      </Link>
    </li>
  )
}
