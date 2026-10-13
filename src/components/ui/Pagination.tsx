import { useSearchParams } from 'react-router-dom'
import type { Page } from '@/types/music'
import { cn } from '@/utils/cn'

/** Página actual leída de `?page=` (1 por defecto). */
export function usePageParam(): number {
  const [params] = useSearchParams()
  const page = Number.parseInt(params.get('page') ?? '1', 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

/**
 * Paginación explícita por `?page=`: cada cambio de página es una sola petición
 * decidida por el usuario (no hay carga infinita al desplazarse).
 */
export function Pagination({ page, data, className }: { page: number; data: Page<unknown>; className?: string }) {
  const [params, setParams] = useSearchParams()
  const totalPages = Math.max(1, Math.ceil(data.total / data.limit))
  if (totalPages <= 1) return null

  const go = (next: number) => {
    const copy = new URLSearchParams(params)
    if (next <= 1) copy.delete('page')
    else copy.set('page', String(next))
    setParams(copy)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const linkClass = 'label-mono inline-flex items-center gap-2 border-b border-ink pb-0.5 transition-colors hover:border-signal hover:text-signal disabled:pointer-events-none disabled:border-transparent disabled:text-ink-faint'

  return (
    <nav aria-label="Paginación" className={cn('flex items-center justify-between gap-4 border-t border-ink pt-5', className)}>
      <button type="button" className={linkClass} disabled={page <= 1} onClick={() => go(page - 1)}>
        <span aria-hidden>←</span> Anterior
      </button>
      <p className="label-mono text-ink-faint" aria-current="page">
        Página {page} de {totalPages.toLocaleString('es-ES')}
      </p>
      <button type="button" className={linkClass} disabled={page >= totalPages} onClick={() => go(page + 1)}>
        Siguiente <span aria-hidden>→</span>
      </button>
    </nav>
  )
}
