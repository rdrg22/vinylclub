/**
 * Ventana de la cuenta en la tienda: entrar / crear cuenta o, con la sesión iniciada, tu
 * perfil (nombre, foto, estadísticas de la colección, favoritos y cerrar sesión).
 */
import { useMemo, useState, type FormEvent } from 'react'
import { useAuth, type AccountUser } from '@/components/auth/authContext'
import { AuthForm } from '@/components/auth/AuthForm'
import { useCollection } from '@/components/collection/collectionContext'
import { useFavorites } from '@/components/favorites/favoritesContext'
import { CHART_ALBUMS } from '@/data/charts/chartCatalog'
import { computeCollectionStats, type CollectionStats } from '@/services/collection/stats'
import { formatPartialDate } from '@/utils/format'
import { StoreWindow, storeButton, storeButtonPrimary } from './StoreWindow'

const CATALOG = new Map(CHART_ALBUMS.map((a) => [a.id, a]))

interface Props {
  onClose: () => void
  /** Ir a la estantería «Colección». */
  onGoToCollection: () => void
}

/** Nombre para saludar: el de la cuenta o, si no hay, la parte del email antes de la @. */
export const displayName = (user: AccountUser) => user.name ?? user.email.split('@')[0] ?? 'tú'

export function ProfileAvatar({ user, className = 'size-full' }: { user: AccountUser; className?: string }) {
  return user.photoUrl ? (
    // Las fotos de Google no se sirven si se envía la página de origen.
    <img src={user.photoUrl} alt="" referrerPolicy="no-referrer" className={`${className} rounded-full object-cover`} />
  ) : (
    <span className={`${className} grid place-items-center rounded-full font-display not-italic`}>{displayName(user).charAt(0).toUpperCase()}</span>
  )
}

export function AccountWindow({ onClose, onGoToCollection }: Props) {
  const auth = useAuth()
  const { items } = useCollection()
  const stats = useMemo(() => computeCollectionStats(items, CATALOG), [items])

  if (auth.state.status === 'signed-in') {
    const user = auth.state.user
    return (
      <StoreWindow
        title={`Hola, ${displayName(user)}`}
        badge={<ProfileAvatar user={user} />}
        subtitle={user.email}
        footer="Tu colección y tus favoritos se guardan en tu cuenta · Esc para cerrar"
        onClose={onClose}
      >
        <NameEditor current={user.name} />
        <StatsPanel stats={stats} />
        <FavoritesLine />
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={onGoToCollection} className={storeButtonPrimary}>
            Ir a mi colección
          </button>
          <button
            type="button"
            onClick={() => {
              void auth.signOut()
              onClose()
            }}
            className={storeButton}
          >
            Cerrar sesión
          </button>
        </div>
      </StoreWindow>
    )
  }

  if (auth.state.status === 'demo') {
    return (
      <StoreWindow title="Tu perfil" badge="♪" subtitle="Modo demostración" onClose={onClose}>
        <p className="text-[#f3e4c3]/85">Las cuentas aún no están activadas en esta copia de la tienda: tu colección se guarda solo en este navegador.</p>
        <StatsPanel stats={stats} />
        <button type="button" onClick={onGoToCollection} className={`${storeButtonPrimary} mt-6`}>
          Ir a mi colección
        </button>
      </StoreWindow>
    )
  }

  return (
    <StoreWindow
      title="Entrar"
      badge="♪"
      subtitle="Registra los discos que tienes en casa"
      footer="Tu cuenta se guarda en Firebase · Esc para cerrar"
      onClose={onClose}
    >
      {auth.state.status === 'loading' ? <p className="label-mono text-[#e8c98f]/80">Comprobando tu sesión…</p> : <AuthForm />}
    </StoreWindow>
  )
}

/** Cambiar el nombre con el que te saluda la tienda. */
function NameEditor({ current }: { current?: string }) {
  const auth = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(current ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="label-mono text-[#e8c98f]/80 underline decoration-[#e8c98f]/40 underline-offset-4 hover:text-[#f3e4c3]">
        {current ? 'Cambiar tu nombre' : 'Añadir tu nombre'}
      </button>
    )
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const result = await auth.updateName(name)
    setBusy(false)
    setError(result)
    if (!result) setEditing(false)
  }

  return (
    <form onSubmit={save} className="flex flex-wrap items-end gap-3">
      <label className="min-w-0 flex-1 basis-56">
        <span className="label-mono block text-ink-soft">Tu nombre</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          autoFocus
          autoComplete="given-name"
          className="mt-1 w-full border-b border-ink/40 bg-transparent py-1.5 text-lg focus:border-ink focus:outline-none"
        />
      </label>
      <button type="submit" disabled={busy} className={storeButtonPrimary}>
        {busy ? 'Guardando…' : 'Guardar'}
      </button>
      <button type="button" onClick={() => setEditing(false)} className={storeButton}>
        Cancelar
      </button>
      {error && <p className="w-full text-sm text-[#ff8a6b]">{error}</p>}
    </form>
  )
}

function FavoritesLine() {
  const { albums } = useFavorites()
  return (
    <p className="mt-5 text-ink-soft">
      <span aria-hidden className="text-[#f2b01e]">★</span>{' '}
      {albums.length === 0 ? 'Aún no tienes favoritos.' : albums.length === 1 ? '1 favorito guardado.' : `${albums.length} favoritos guardados.`}
    </p>
  )
}

/** Como los carteles de la tienda: «Años 70», «Años 2020». */
const decadeLabel = (decade: number) => `Años ${decade >= 2000 ? decade : decade % 100}`

/** Estadísticas de la colección: cifras, décadas en barras, artistas y extremos. */
function StatsPanel({ stats }: { stats: CollectionStats }) {
  if (stats.total === 0) {
    return (
      <section className="mt-5 border-t border-rule pt-4">
        <h3 className="label-mono text-ink-faint">Tu colección</h3>
        <p className="mt-2 text-ink-soft">Todavía está vacía. Pulsa el «+» de la estantería Colección para añadir tu primer disco.</p>
      </section>
    )
  }
  const max = Math.max(...stats.decades.map((d) => d.count))
  const figures = [
    { value: stats.total, label: stats.total === 1 ? 'disco' : 'discos' },
    { value: stats.formats.vinyl, label: 'en vinilo' },
    { value: stats.formats.cd, label: 'en CD' },
    ...(stats.formats.other ? [{ value: stats.formats.other, label: 'otros formatos' }] : []),
    { value: stats.numberOnes, label: 'nº 1 de Billboard' },
  ]

  return (
    <section className="mt-5 border-t border-rule pt-4">
      <h3 className="label-mono text-ink-faint">Tu colección</h3>
      <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
        {figures.map((f) => (
          <div key={f.label}>
            <dd className="font-display text-3xl leading-none font-semibold">{f.value}</dd>
            <dt className="label-mono mt-1 text-ink-faint">{f.label}</dt>
          </div>
        ))}
      </dl>

      <div className="mt-5 grid gap-6 sm:grid-cols-2">
        <div>
          <h4 className="label-mono text-ink-faint">Por décadas</h4>
          <ul className="mt-2 space-y-1.5">
            {stats.decades.map((d) => (
              <li key={d.decade} className="flex items-center gap-3 text-sm">
                <span className="label-mono w-20 shrink-0 text-ink-soft">{decadeLabel(d.decade)}</span>
                <span className="h-2.5 flex-1 rounded-full bg-black/25">
                  <span className="block h-full rounded-full bg-[#e8c98f]" style={{ width: `${(d.count / max) * 100}%` }} />
                </span>
                <span className="w-6 shrink-0 text-right tabular-nums">{d.count}</span>
              </li>
            ))}
          </ul>
          {stats.undated > 0 && <p className="label-mono mt-2 text-ink-faint">{stats.undated} sin fecha</p>}
        </div>

        <div className="space-y-4 text-sm">
          {stats.topArtists.length > 0 && (
            <div>
              <h4 className="label-mono text-ink-faint">Tus artistas</h4>
              <ol className="mt-2 space-y-1">
                {stats.topArtists.map((a) => (
                  <li key={a.artist} className="flex justify-between gap-3">
                    <span className="truncate">{a.artist}</span>
                    <span className="shrink-0 tabular-nums text-ink-soft">{a.count} discos</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {stats.oldest && <Extreme label="El más antiguo" item={stats.oldest} />}
          {stats.newest && stats.newest !== stats.oldest && <Extreme label="El más reciente" item={stats.newest} />}
        </div>
      </div>
    </section>
  )
}

function Extreme({ label, item }: { label: string; item: NonNullable<CollectionStats['oldest']> }) {
  return (
    <div>
      <h4 className="label-mono text-ink-faint">{label}</h4>
      <p className="mt-1 truncate">
        <span className="font-medium">{item.title}</span> <span className="text-ink-soft">· {item.artist}</span>
      </p>
      <p className="label-mono text-ink-faint">{formatPartialDate(item.date)}</p>
    </div>
  )
}
