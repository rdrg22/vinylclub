import { isDemoMode } from '@/config/env'

/** Aviso mientras no hay Supabase: la tienda funciona, pero nada personal se guarda. */
export function DemoBanner() {
  if (!isDemoMode) return null
  return (
    <div className="bg-ink text-paper">
      <p className="label-mono mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-8">
        <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-signal" />
        <span>
          <strong className="font-medium">Sin cuentas todavía</strong>
          <span className="text-paper/70">
            {' · '}
            <span className="hidden sm:inline">Puedes recorrer la tienda; favoritos y colección llegarán con el inicio de sesión.</span>
            <span className="sm:hidden">Favoritos y colección, próximamente</span>
          </span>
        </span>
      </p>
    </div>
  )
}
