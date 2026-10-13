import { AlbumCover } from '@/components/album/AlbumCover'
import { useAlbumDetail } from '@/components/album/albumDetailContext'
import type { Release } from '@/types/music'
import { countryName, formatPartialDate } from '@/utils/format'

const STATUS: Record<string, string> = {
  Official: 'Oficial',
  Promotion: 'Promocional',
  Bootleg: 'No oficial',
  'Pseudo-Release': 'Pseudoedición',
}

/** Una edición concreta. Al pulsarla se abre la ficha del disco al que pertenece. */
export function ReleaseRow({ release }: { release: Release }) {
  const { openAlbum } = useAlbumDetail()
  const facts = [
    formatPartialDate(release.date),
    countryName(release.country),
    release.formats.join(' + ') || undefined,
    release.trackCount ? `${release.trackCount} pistas` : undefined,
    release.status ? (STATUS[release.status] ?? release.status) : undefined,
  ].filter(Boolean)

  return (
    <li>
      <button type="button" onClick={() => openAlbum(release.album)} className="group flex w-full items-center gap-4 py-4 text-left">
        <AlbumCover album={release.album} className="size-14 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium transition-colors group-hover:text-signal">{release.title}</span>
          <span className="block truncate text-sm text-ink-soft">{release.artist}</span>
          {facts.length > 0 && <span className="label-mono mt-1 block truncate text-ink-faint">{facts.join(' · ')}</span>}
        </span>
        {release.labels.length > 0 && (
          <span className="label-mono hidden max-w-48 truncate text-right text-ink-faint md:block">{release.labels.join(', ')}</span>
        )}
      </button>
    </li>
  )
}
