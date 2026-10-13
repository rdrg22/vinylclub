import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { StateMessage } from '@/components/ui/StateMessage'
import { cn } from '@/utils/cn'

const TABS = [
  {
    id: 'favoritos',
    label: 'Favoritos',
    empty: 'Aún no has marcado ningún favorito',
    text: 'Los favoritos son discos que te interesan, independientes de tus estanterías.',
  },
  {
    id: 'coleccion',
    label: 'Mi colección',
    empty: 'Tu colección está vacía',
    text: 'Tu colección reúne los discos que tienes en casa.',
  },
] as const

type TabId = (typeof TABS)[number]['id']

/** Favoritos y colección personal. Fase 1: navegación y estados; el guardado llega con Supabase (fase 4). */
export function LibraryPage() {
  const [params, setParams] = useSearchParams()
  const active: TabId = params.get('tab') === 'coleccion' ? 'coleccion' : 'favoritos'
  const tab = TABS.find((t) => t.id === active) ?? TABS[0]

  return (
    <>
      <PageHeader eyebrow="Tu biblioteca" title="Colección" />

      <div role="tablist" aria-label="Biblioteca" className="flex gap-8 border-b border-rule">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={t.id === active}
            aria-controls="library-panel"
            onClick={() => setParams({ tab: t.id }, { replace: true })}
            className={cn(
              '-mb-px border-b-2 pb-3 font-display text-xl transition-colors sm:text-2xl',
              t.id === active ? 'border-signal text-ink' : 'border-transparent text-ink-faint hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id="library-panel" role="tabpanel" aria-labelledby={`tab-${active}`}>
        <StateMessage tone="pending" eyebrow="Próximamente" title={tab.empty} className="mt-8 border-t-0">
          {tab.text} Podrás guardar discos desde su ficha cuando se active la cuenta de usuario.
        </StateMessage>
      </div>
    </>
  )
}
