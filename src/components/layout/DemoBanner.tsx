import { isDemoMode } from '@/config/env'

/** Aviso mientras no hay Supabase: la tienda funciona, pero nada personal se guarda. */
export function DemoBanner() {
  if (!isDemoMode) return null
  return (
    <div className="bg-ink text-paper">
      <p className="label-mono mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-8">
        <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-signal" />
        <span>
          <strong className="font-medium">Favoritos temporales</strong>
          <span className="text-paper/70">
            {' · '}
            <span className="hidden sm:inline">Aún no hay cuentas: los favoritos se borran al recargar la página.</span>
            <span className="sm:hidden">Se borran al recargar</span>
          </span>
        </span>
      </p>
    </div>
  )
}
