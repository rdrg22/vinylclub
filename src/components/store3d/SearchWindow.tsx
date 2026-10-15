/**
 * Ventana «Buscar» de la tienda. Mientras se escribe aparecen al instante los discos de
 * las propias estanterías; además se consulta MusicBrainz (con una pausa al teclear, por
 * su límite de una petición por segundo). Al elegir uno, el disco aparece delante de la
 * cámara y se coge como los de la balda: portada, reverso, demo y enlaces.
 */
import { useEffect, useMemo, useState } from 'react'
import { AlbumCover } from '@/components/album/AlbumCover'
import { FormNotice } from '@/components/ui/Field'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { describeMusicBrainzError } from '@/services/musicbrainz/client'
import { searchAlbums } from '@/services/musicbrainz/musicbrainz'
import type { Album } from '@/types/music'
import { StoreWindow } from './StoreWindow'

const DEBOUNCE_MS = 650
const MAX_LOCAL = 8

const fold = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** Discos de la tienda cuyo título o artista contienen todas las palabras buscadas. */
export function searchCatalog(catalog: Album[], text: string, max = MAX_LOCAL): Album[] {
  const words = fold(text).split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  return catalog.filter((a) => {
    const hay = fold(`${a.title} ${a.artist}`)
    return words.every((w) => hay.includes(w))
  }).slice(0, max)
}

interface Props {
  catalog: Album[]
  onPick: (album: Album) => void
  onClose: () => void
}

export function SearchWindow({ catalog, onPick, onClose }: Props) {
  const [text, setText] = useState('')
  const [query, setQuery] = useState('')

  // MusicBrainz se consulta al dejar de teclear (o al pulsar Intro).
  useEffect(() => {
    const clean = text.trim()
    const timer = setTimeout(() => setQuery(clean.length >= 2 ? clean : ''), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [text])

  const local = useMemo(() => searchCatalog(catalog, text), [catalog, text])
  const remote = useAsyncResource(query ? `search|${query}` : null, (signal) => searchAlbums(query, 1, signal))
  const localIds = useMemo(() => new Set(local.map((a) => a.id)), [local])
  const remoteAlbums = remote.status === 'success' ? remote.data.items.filter((a) => !localIds.has(a.id)) : []
  const typing = text.trim() !== query && text.trim().length >= 2

  return (
    <StoreWindow title="Buscar un disco" badge="⌕" subtitle="Título, artista o ambos" footer="Datos de MusicBrainz · Esc para cerrar" onClose={onClose}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          setQuery(text.trim())
        }}
      >
        <label className="block">
          <span className="sr-only">Buscar un disco</span>
          <input
            type="text"
            enterKeyHint="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
            autoComplete="off"
            placeholder="p. ej. Fleetwood Mac Rumours"
            className="w-full border-b border-ink/40 bg-transparent py-2 text-xl placeholder:text-ink-faint focus:border-ink focus:outline-none"
          />
        </label>
      </form>

      {local.length > 0 && (
        <ResultList title="En la tienda" albums={local} onPick={onPick} />
      )}

      <div className="mt-5" aria-live="polite">
        {(typing || remote.status === 'loading') && <p className="label-mono text-ink-faint">Buscando en MusicBrainz…</p>}
        {!typing && remote.status === 'error' && (
          <FormNotice tone="error">
            {describeMusicBrainzError(remote.error)}{' '}
            <button type="button" onClick={remote.retry} className="underline">
              Reintentar
            </button>
          </FormNotice>
        )}
        {!typing && remote.status === 'success' && (
          remoteAlbums.length > 0 ? (
            <ResultList title="En MusicBrainz" albums={remoteAlbums} onPick={onPick} />
          ) : (
            local.length === 0 && <p className="text-ink-soft">No hay discos con «{query}».</p>
          )
        )}
      </div>
    </StoreWindow>
  )
}

function ResultList({ title, albums, onPick }: { title: string; albums: Album[]; onPick: (album: Album) => void }) {
  return (
    <section className="mt-5">
      <h3 className="label-mono text-ink-faint">{title}</h3>
      <ul className="mt-2 divide-y divide-rule border-y border-rule">
        {albums.map((album) => {
          const chart = album.charts?.[0]
          const facts = [album.year, chart && `nº ${chart.rank} en ${chart.year}`].filter(Boolean).join(' · ')
          return (
            <li key={album.id}>
              <button type="button" onClick={() => onPick(album)} className="group flex w-full items-center gap-4 py-3 text-left">
                <AlbumCover album={album} className="size-14 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium transition-colors group-hover:text-signal">{album.title}</span>
                  <span className="block truncate text-sm text-ink-soft">{album.artist}</span>
                  {facts && <span className="label-mono mt-1 block truncate text-ink-faint">{facts}</span>}
                </span>
                <span className="label-mono shrink-0 text-ink-faint transition-colors group-hover:text-ink">Cogerlo →</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
