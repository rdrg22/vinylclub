import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AlbumCover } from '@/components/album/AlbumCover'
import { useAlbumDetail } from '@/components/album/albumDetailContext'
import { useAuth } from '@/components/auth/authContext'
import { AddRecord } from '@/components/collection/AddRecord'
import { useCollection } from '@/components/collection/collectionContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { StateMessage } from '@/components/ui/StateMessage'
import { albumOf, isVinyl, type CollectionItem } from '@/services/collection/collection'
import { cn } from '@/utils/cn'
import { countryName, formatPartialDate } from '@/utils/format'

type Sort = 'recent' | 'artist' | 'year'

const SORTS: Record<Sort, { label: string; compare: (a: CollectionItem, b: CollectionItem) => number }> = {
  recent: { label: 'Recientes', compare: (a, b) => b.addedAt.localeCompare(a.addedAt) },
  artist: { label: 'Artista', compare: (a, b) => a.artist.localeCompare(b.artist, 'es') || a.title.localeCompare(b.title, 'es') },
  year: { label: 'Año', compare: (a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999') },
}

const fold = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export function CollectionPage() {
  const auth = useAuth()
  const collection = useCollection()
  const [sort, setSort] = useState<Sort>('recent')
  const [filter, setFilter] = useState('')

  const visible = useMemo(() => {
    const f = fold(filter.trim())
    return collection.items
      .filter((i) => !f || fold(`${i.title} ${i.artist} ${i.labels.join(' ')} ${i.barcode ?? ''}`).includes(f))
      .sort(SORTS[sort].compare)
  }, [collection.items, filter, sort])

  if (auth.state.status === 'signed-out') return <Navigate to="/entrar?siguiente=/coleccion" replace />

  const count = collection.items.length
  const vinyls = collection.items.filter((i) => isVinyl(i.formats)).length

  return (
    <>
      <PageHeader
        eyebrow={count === 1 ? '1 disco' : `${count} discos${vinyls && vinyls !== count ? ` · ${vinyls} en vinilo` : ''}`}
        title="Mi colección"
        action={<AccountBox />}
      >
        Los discos que tienes en casa. Añádelos con el código de barras de la funda o buscando por título.
      </PageHeader>

      {collection.where === 'browser' && (
        <p className="label-mono mb-6 border-l-2 border-signal pl-3 text-ink-soft">
          Modo demostración: sin cuentas activadas, tu colección se guarda solo en este navegador.
        </p>
      )}

      <AddRecord />

      <section aria-labelledby="mine-title" className="mt-14 border-t-2 border-ink pt-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="mine-title" className="font-display text-3xl font-medium tracking-tight">
            En tus estanterías
          </h2>
          {count > 1 && (
            <div className="flex flex-wrap items-end gap-5">
              <label className="block">
                <span className="sr-only">Filtrar tu colección</span>
                <input
                  type="search"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filtrar…"
                  className="w-44 border-b border-rule bg-transparent py-1.5 text-sm placeholder:text-ink-faint focus:border-ink focus:outline-none"
                />
              </label>
              <div role="group" aria-label="Ordenar por" className="flex gap-4">
                {(Object.keys(SORTS) as Sort[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={sort === s}
                    onClick={() => setSort(s)}
                    className={cn('label-mono border-b-2 pb-1', sort === s ? 'border-signal text-ink' : 'border-transparent text-ink-faint hover:text-ink')}
                  >
                    {SORTS[s].label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {collection.status === 'loading' || auth.state.status === 'loading' ? (
          <p className="label-mono mt-6 text-ink-faint">Cargando tu colección…</p>
        ) : collection.status === 'error' ? (
          <StateMessage tone="error" eyebrow="Error" title="No se pudo cargar tu colección" className="mt-6" action={
            <button type="button" onClick={collection.reload} className="label-mono underline">Reintentar</button>
          } />
        ) : count === 0 ? (
          <StateMessage eyebrow="Colección vacía" title="Todavía no has añadido ningún disco" className="mt-6">
            Busca arriba el primero: escribe el código de barras de la funda o el título del disco.
          </StateMessage>
        ) : visible.length === 0 ? (
          <p className="mt-6 text-ink-soft">Ningún disco de tu colección coincide con «{filter}».</p>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {visible.map((item) => (
              <CollectionCard key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

function AccountBox() {
  const auth = useAuth()
  if (auth.state.status !== 'signed-in') return null
  return (
    <div className="text-right">
      <p className="label-mono text-ink-faint">Sesión iniciada</p>
      <p className="max-w-64 truncate text-sm">{auth.state.user.email}</p>
      <button type="button" onClick={() => void auth.signOut()} className="label-mono mt-1 text-ink-soft underline underline-offset-4 hover:text-signal">
        Cerrar sesión
      </button>
    </div>
  )
}

function CollectionCard({ item }: { item: CollectionItem }) {
  const { openAlbum } = useAlbumDetail()
  const collection = useCollection()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const album = albumOf(item)
  const facts = [formatPartialDate(item.date), item.formats.join(' + ') || undefined, countryName(item.country)].filter(Boolean)

  return (
    <li className="group flex flex-col">
      <button type="button" onClick={() => openAlbum(album)} className="text-left" aria-label={`Ficha de ${item.title}, de ${item.artist}`}>
        <AlbumCover album={album} className="aspect-square w-full shadow-[0_1px_0_var(--color-rule)] transition-transform duration-300 group-hover:-translate-y-1" />
      </button>
      <p className="mt-3 line-clamp-2 leading-snug font-medium">{item.title}</p>
      <p className="truncate text-sm text-ink-soft">{item.artist}</p>
      {facts.length > 0 && <p className="label-mono mt-1 line-clamp-2 text-ink-faint">{facts.join(' · ')}</p>}
      {error && <p className="mt-1 text-sm text-signal-deep">{error}</p>}
      <div className="mt-2 flex gap-3">
        {confirming ? (
          <>
            <button
              type="button"
              onClick={async () => setError(await collection.remove(item.id))}
              className="label-mono text-signal hover:underline"
            >
              Sí, quitar
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="label-mono text-ink-faint hover:text-ink">
              Cancelar
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="label-mono text-ink-faint hover:text-signal">
            Quitar
          </button>
        )}
      </div>
    </li>
  )
}
