import { cn } from '@/utils/cn'

/** Resumen compacto de filtros, separado por puntos medios como un ticket de catálogo. */
export function FilterChips({ labels, className }: { labels: string[]; className?: string }) {
  if (labels.length === 0) return null
  return (
    <ul className={cn('label-mono flex flex-wrap gap-x-2 gap-y-1 text-ink-faint', className)}>
      {labels.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden>·</span>}
          {label}
        </li>
      ))}
    </ul>
  )
}
