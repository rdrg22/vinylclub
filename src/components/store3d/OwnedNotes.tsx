/**
 * En la cartela de un disco de tu colección: lo que te costó y tu nota, editables.
 * Con el precio, la estantería le pone su pegatina y el perfil suma toda la colección.
 */
import { useState, type FormEvent } from 'react'
import { useCollection } from '@/components/collection/collectionContext'
import { formatPrice, MAX_NOTE, parsePrice, type CollectionItem } from '@/services/collection/collection'
import { countryName, formatPartialDate } from '@/utils/format'

const button =
  'label-mono rounded-sm border border-[#e8c98f]/50 px-3 py-2 text-[#f3e4c3] transition-colors hover:border-[#e8c98f] hover:bg-[#e8c98f]/10'

export function OwnedNotes({ items }: { items: CollectionItem[] }) {
  // Normalmente una edición; si tienes varias, se elige cuál.
  const [selectedId, setSelectedId] = useState(items[0]?.id)
  const item = items.find((i) => i.id === selectedId) ?? items[0]
  const [editing, setEditing] = useState(false)
  if (!item) return null

  const edition = [formatPartialDate(item.date), countryName(item.country), item.formats.join(' + ')].filter(Boolean).join(' · ')

  return (
    <div className="mt-4 border-t border-[#e8c98f]/25 pt-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="label-mono text-[#e8c98f]/80">Tu disco</p>
        {items.length > 1 ? (
          <select
            value={item.id}
            onChange={(e) => {
              setSelectedId(e.target.value)
              setEditing(false)
            }}
            className="label-mono max-w-full rounded-sm border border-[#e8c98f]/40 bg-[#2a1a0e] px-2 py-1 text-[#f3e4c3]"
          >
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {[formatPartialDate(i.date), countryName(i.country), i.formats.join(' + ')].filter(Boolean).join(' · ') || i.title}
              </option>
            ))}
          </select>
        ) : (
          edition && <p className="label-mono text-[#f3e4c3]/60">{edition}</p>
        )}
      </div>

      {editing ? (
        <NotesForm key={item.id} item={item} onDone={() => setEditing(false)} />
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {item.price !== undefined && (
            <span className="rounded-sm bg-[#ffd23f] px-2.5 py-1 font-display text-lg leading-none font-semibold text-[#2a1a0e] italic shadow -rotate-2">
              {formatPrice(item.price)}
            </span>
          )}
          {item.note && <p className="min-w-0 flex-1 basis-48 text-sm text-[#f3e4c3]/85 italic">«{item.note}»</p>}
          <button type="button" onClick={() => setEditing(true)} className={button}>
            ✎ {item.price === undefined && !item.note ? 'Añadir precio y nota' : 'Editar'}
          </button>
        </div>
      )}
    </div>
  )
}

function NotesForm({ item, onDone }: { item: CollectionItem; onDone: () => void }) {
  const collection = useCollection()
  const [price, setPrice] = useState(item.price !== undefined ? String(item.price).replace('.', ',') : '')
  const [note, setNote] = useState(item.note ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(e: FormEvent) {
    e.preventDefault()
    const parsed = price.trim() ? parsePrice(price) : null
    if (price.trim() && parsed === null) {
      setError('Escribe el precio en euros, por ejemplo 24,99.')
      return
    }
    setBusy(true)
    const result = await collection.update(item.id, { price: parsed, note: note.trim() || null })
    setBusy(false)
    if (result) setError(result)
    else onDone()
  }

  return (
    <form
      onSubmit={save}
      // Escribir aquí no gira ni devuelve el disco (F, espacio, Esc son atajos de la cartela).
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Escape') onDone()
      }}
      className="mt-2 grid gap-3 sm:grid-cols-[9rem_1fr_auto] sm:items-end"
    >
      <label className="block">
        <span className="label-mono block text-[#e8c98f]/80">Te costó (€)</span>
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          inputMode="decimal"
          placeholder="24,99"
          autoFocus
          className="mt-1 w-full border-b border-[#e8c98f]/50 bg-transparent py-1.5 text-lg text-[#f3e4c3] tabular-nums placeholder:text-[#f3e4c3]/30 focus:border-[#e8c98f] focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="label-mono block text-[#e8c98f]/80">Nota (opcional)</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={MAX_NOTE}
          placeholder="Estado, dónde lo compraste…"
          className="mt-1 w-full border-b border-[#e8c98f]/50 bg-transparent py-1.5 text-[#f3e4c3] placeholder:text-[#f3e4c3]/30 focus:border-[#e8c98f] focus:outline-none"
        />
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="label-mono rounded-sm bg-[#f3e4c3] px-3 py-2 text-[#1b130c] hover:bg-signal hover:text-paper disabled:opacity-50">
          {busy ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" onClick={onDone} className={button}>
          Cancelar
        </button>
      </div>
      {error && <p className="text-sm text-[#ff8a6b] sm:col-span-3">{error}</p>}
    </form>
  )
}
