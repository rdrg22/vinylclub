/**
 * Añadir un disco a la colección: por código de barras (escrito o escaneado) o por
 * título/artista. Se busca en MusicBrainz y el usuario elige su edición exacta.
 * Solo se consulta al pulsar «Buscar» (límite de 1 petición/s de MusicBrainz).
 */
import { useState, type FormEvent } from 'react'
import { AlbumCover } from '@/components/album/AlbumCover'
import { buttonClass } from '@/components/ui/buttonStyles'
import { FormNotice } from '@/components/ui/Field'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { barcodeVariants, checkBarcode, normalizeBarcode } from '@/services/collection/barcode'
import { isVinyl } from '@/services/collection/collection'
import { describeMusicBrainzError } from '@/services/musicbrainz/client'
import { searchReleasesByBarcode, searchReleasesForCollection } from '@/services/musicbrainz/musicbrainz'
import type { Release } from '@/types/music'
import { cn } from '@/utils/cn'
import { countryName, formatPartialDate } from '@/utils/format'
import { BarcodeScanner, canScanBarcodes } from './BarcodeScanner'
import { useCollection } from './collectionContext'

type Mode = 'barcode' | 'title'

interface Query {
  mode: Mode
  value: string
}

export function AddRecord() {
  const [mode, setMode] = useState<Mode>('barcode')
  const [text, setText] = useState('')
  const [query, setQuery] = useState<Query | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanSupported] = useState(canScanBarcodes)

  const key = query ? `${query.mode}:${query.value}` : null
  const results = useAsyncResource<Release[]>(key, (signal) =>
    query!.mode === 'barcode'
      ? searchReleasesByBarcode(barcodeVariants(query!.value), signal)
      : searchReleasesForCollection(query!.value, signal),
  )

  const check = mode === 'barcode' ? checkBarcode(text) : null

  function search(value: string, m: Mode = mode) {
    const clean = m === 'barcode' ? normalizeBarcode(value) : value.trim()
    if (m === 'barcode' ? clean.length < 6 : clean.length < 2) return
    setQuery({ mode: m, value: clean })
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    search(text)
  }

  return (
    <section aria-labelledby="add-title" className="border-t-2 border-ink pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 id="add-title" className="font-display text-3xl font-medium tracking-tight">
          Añadir un disco
        </h2>
        <div role="tablist" aria-label="Buscar por" className="flex gap-5">
          {(
            [
              ['barcode', 'Código de barras'],
              ['title', 'Título o artista'],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m)
                setText('')
                setQuery(null)
              }}
              className={cn('label-mono border-b-2 pb-1 transition-colors', mode === m ? 'border-signal text-ink' : 'border-transparent text-ink-faint hover:text-ink')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-5 flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 basis-64">
          <span className="label-mono block text-ink-soft">{mode === 'barcode' ? 'Número del código de barras' : 'Título del disco, artista o ambos'}</span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            inputMode={mode === 'barcode' ? 'numeric' : 'search'}
            autoComplete="off"
            placeholder={mode === 'barcode' ? 'p. ej. 5099902987613' : 'p. ej. Pink Floyd The Wall'}
            className="mt-1 w-full border-b border-ink/40 bg-transparent py-2 text-lg tabular-nums placeholder:text-ink-faint focus:border-ink focus:outline-none"
          />
        </label>
        {mode === 'barcode' && scanSupported && (
          <button type="button" onClick={() => setScanning(true)} className={buttonClass('quiet')}>
            <svg aria-hidden viewBox="0 0 20 20" className="size-4">
              <path d="M2 6V3h3M15 3h3v3M18 14v3h-3M5 17H2v-3" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M6 6v8M8.5 6v8M10 6v8M12.5 6v8M14 6v8" stroke="currentColor" strokeWidth="1.1" />
            </svg>
            Escanear
          </button>
        )}
        <button type="submit" className={buttonClass('primary')}>
          Buscar
        </button>
      </form>

      {check === 'unchecked' && (
        <p className="mt-2 text-sm text-ink-faint">El dígito de control no cuadra; buscaremos igualmente por si la funda lo trae así.</p>
      )}
      {check === 'too-short' && <p className="mt-2 text-sm text-ink-faint">Los códigos de barras de discos suelen tener 12 o 13 cifras.</p>}

      {scanning && (
        <BarcodeScanner
          onClose={() => setScanning(false)}
          onDetected={(code) => {
            setScanning(false)
            setText(code)
            search(code, 'barcode')
          }}
        />
      )}

      <div className="mt-6" aria-live="polite">
        {results.status === 'loading' && <p className="label-mono text-ink-faint">Buscando en MusicBrainz…</p>}
        {results.status === 'error' && (
          <FormNotice tone="error">
            {describeMusicBrainzError(results.error)}{' '}
            <button type="button" onClick={results.retry} className="underline">
              Reintentar
            </button>
          </FormNotice>
        )}
        {results.status === 'success' && query && (
          results.data.length === 0 ? (
            <p className="text-ink-soft">
              {query.mode === 'barcode'
                ? 'Ese código no está en MusicBrainz. Prueba a buscar el disco por su título.'
                : 'No hay ediciones con ese título en MusicBrainz.'}
            </p>
          ) : (
            <>
              <p className="label-mono text-ink-faint">
                {results.data.length === 1 ? '1 edición' : `${results.data.length} ediciones`} · elige la tuya
              </p>
              <ul className="mt-2 divide-y divide-rule border-y border-rule">
                {results.data.map((release) => (
                  <ResultRow key={release.id} release={release} />
                ))}
              </ul>
            </>
          )
        )}
      </div>
    </section>
  )
}

function ResultRow({ release }: { release: Release }) {
  const collection = useCollection()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const owned = collection.has(release.id)
  const vinyl = isVinyl(release.formats)
  const facts = [
    formatPartialDate(release.date),
    countryName(release.country),
    release.formats.join(' + ') || undefined,
    release.labels[0],
  ].filter(Boolean)

  return (
    <li className="flex items-center gap-4 py-3">
      <AlbumCover album={release.album} className="size-14 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {release.title}
          {vinyl && <span className="label-mono ml-2 bg-ink px-1.5 py-px align-middle text-[0.6rem] text-paper">Vinilo</span>}
        </p>
        <p className="truncate text-sm text-ink-soft">{release.artist}</p>
        {facts.length > 0 && <p className="label-mono mt-1 truncate text-ink-faint">{facts.join(' · ')}</p>}
        {release.barcode && <p className="label-mono truncate text-ink-faint tabular-nums">{release.barcode}</p>}
        {error && <p className="mt-1 text-sm text-signal-deep">{error}</p>}
      </div>
      {owned ? (
        <span className="label-mono shrink-0 text-ink-soft">✓ En tu colección</span>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            setError(await collection.add(release))
            setBusy(false)
          }}
          className={buttonClass('primary', 'shrink-0 px-4 py-2')}
        >
          {busy ? 'Añadiendo…' : '+ Añadir'}
        </button>
      )}
    </li>
  )
}
