import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlbumGrid } from '@/components/album/AlbumGrid'
import { ArtistRow } from '@/components/search/ArtistRow'
import { ArtistSuggestion } from '@/components/search/ArtistSuggestion'
import { ReleaseRow } from '@/components/search/ReleaseRow'
import { LoadError } from '@/components/ui/LoadError'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination, usePageParam } from '@/components/ui/Pagination'
import { AlbumGridSkeleton, RowsSkeleton } from '@/components/ui/Skeletons'
import { StateMessage } from '@/components/ui/StateMessage'
import { useAlbumSearch, useArtistSearch, useReleaseSearch } from '@/hooks/useAlbums'
import type { Resource } from '@/hooks/useAsyncResource'
import type { Page } from '@/types/music'
import { cn } from '@/utils/cn'
import { formatCount } from '@/utils/format'

const TABS = [
  { param: 'discos', label: 'Discos', noun: ['disco', 'discos'] },
  { param: 'artistas', label: 'Artistas', noun: ['artista', 'artistas'] },
  { param: 'ediciones', label: 'Ediciones', noun: ['edición', 'ediciones'] },
] as const

type Tab = (typeof TABS)[number]

export function SearchPage() {
  const [params] = useSearchParams()
  const query = params.get('q')?.trim() ?? ''
  const tab = TABS.find((t) => t.param === params.get('tipo')) ?? TABS[0]
  const page = usePageParam()

  return (
    <>
      <PageHeader eyebrow="Catálogo · MusicBrainz" title={query ? `«${query}»` : 'Buscar'} />

      {query ? (
        <>
          <SearchTabs query={query} active={tab} />
          <div className="pt-8">
            {tab.param === 'discos' && <AlbumResults query={query} page={page} tab={tab} />}
            {tab.param === 'artistas' && <ArtistResults query={query} page={page} tab={tab} />}
            {tab.param === 'ediciones' && <ReleaseResults query={query} page={page} tab={tab} />}
          </div>
        </>
      ) : (
        <StateMessage eyebrow="Empieza por un nombre" title="¿Qué disco estás buscando?">
          Escribe un artista o un álbum en el buscador de arriba. Pulsa{' '}
          <kbd className="label-mono border border-rule px-1">/</kbd> para ir directo a él.
        </StateMessage>
      )}
    </>
  )
}

function SearchTabs({ query, active }: { query: string; active: Tab }) {
  return (
    <nav aria-label="Tipo de resultado" className="flex gap-6 border-b border-rule sm:gap-8">
      {TABS.map((t) => (
        <Link
          key={t.param}
          to={`/buscar?${new URLSearchParams({ q: query, ...(t.param === 'discos' ? {} : { tipo: t.param }) })}`}
          aria-current={t.param === active.param ? 'page' : undefined}
          className={cn(
            '-mb-px border-b-2 pb-3 font-display text-xl transition-colors sm:text-2xl',
            t.param === active.param ? 'border-signal text-ink' : 'border-transparent text-ink-faint hover:text-ink',
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  )
}

function AlbumResults({ query, page, tab }: ResultsProps) {
  const resource = useAlbumSearch(query, page)
  return (
    <>
      {page === 1 && <ArtistSuggestion query={query} enabled={resource.status === 'success'} />}
      <Results resource={resource} page={page} tab={tab} query={query} skeleton={<AlbumGridSkeleton />}>
        {(data) => <AlbumGrid albums={data.items} label={`Discos que coinciden con ${query}`} />}
      </Results>
    </>
  )
}

function ArtistResults({ query, page, tab }: ResultsProps) {
  const resource = useArtistSearch(query, page)
  return (
    <Results resource={resource} page={page} tab={tab} query={query} skeleton={<RowsSkeleton />}>
      {(data) => (
        <ul className="divide-y divide-rule border-y border-rule">
          {data.items.map((artist) => (
            <ArtistRow key={artist.id} artist={artist} />
          ))}
        </ul>
      )}
    </Results>
  )
}

function ReleaseResults({ query, page, tab }: ResultsProps) {
  const resource = useReleaseSearch(query, page)
  return (
    <Results resource={resource} page={page} tab={tab} query={query} skeleton={<RowsSkeleton />}>
      {(data) => (
        <ul className="divide-y divide-rule border-y border-rule">
          {data.items.map((release) => (
            <ReleaseRow key={release.id} release={release} />
          ))}
        </ul>
      )}
    </Results>
  )
}

interface ResultsProps {
  query: string
  page: number
  tab: Tab
}

/** Estados comunes de una búsqueda: cargando, error, sin resultados y resultados paginados. */
function Results<T>({
  resource,
  page,
  tab,
  query,
  skeleton,
  children,
}: ResultsProps & {
  resource: Resource<Page<T>> & { retry: () => void }
  skeleton: ReactNode
  children: (data: Page<T>) => ReactNode
}) {
  if (resource.status === 'loading' || resource.status === 'idle')
    return (
      <div role="status" aria-label="Buscando en MusicBrainz">
        <p className="label-mono mb-6 text-ink-faint">Buscando en MusicBrainz…</p>
        {skeleton}
      </div>
    )

  if (resource.status === 'error') return <LoadError error={resource.error} onRetry={resource.retry} />

  const { data } = resource
  if (data.items.length === 0)
    return (
      <StateMessage eyebrow="Sin resultados" title={`No hay ${tab.noun[1]} para «${query}»`}>
        {page > 1
          ? 'No hay más resultados en esta página.'
          : 'Revisa la ortografía, prueba con menos palabras o busca solo por el nombre del artista.'}
      </StateMessage>
    )

  return (
    <>
      <p className="label-mono mb-6 text-ink-faint" aria-live="polite">
        {formatCount(data.total)} {data.total === 1 ? tab.noun[0] : tab.noun[1]} en MusicBrainz
      </p>
      {children(data)}
      <Pagination page={page} data={data} className="mt-12" />
    </>
  )
}
