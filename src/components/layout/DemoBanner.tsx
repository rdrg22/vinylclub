import { isDemoMode } from '@/config/env'

/** Aviso permanente: en modo demostración los discos son datos de ejemplo. */
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
            <span className="hidden sm:inline">Supabase no está configurado. Los discos de la tienda son datos de ejemplo.</span>
            <span className="sm:hidden">Discos de ejemplo</span>
          </span>
        </span>
      </p>
    </div>
  )
}
