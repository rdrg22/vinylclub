import { isDemoMode } from '@/config/env'

/** Aviso mientras no hay Firebase: la tienda funciona, pero nada personal sale de este navegador. */
export function DemoBanner() {
  if (!isDemoMode) return null
  return (
    <div className="bg-ink text-paper">
      <p className="label-mono mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-8">
        <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-signal" />
        <span>
          <strong className="font-medium">Modo demostración</strong>
          <span className="text-paper/70">
            {' · '}
            <span className="hidden sm:inline">Cuentas sin activar: la colección se guarda solo en este navegador y los favoritos se borran al recargar.</span>
            <span className="sm:hidden">Sin cuentas: todo queda en este navegador</span>
          </span>
        </span>
      </p>
    </div>
  )
}
