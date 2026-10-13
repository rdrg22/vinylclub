import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Tone = 'empty' | 'error' | 'pending'

interface StateMessageProps {
  tone?: Tone
  /** Texto corto en mono sobre el título, p. ej. «Sin resultados». */
  eyebrow: string
  title: string
  children?: ReactNode
  action?: ReactNode
  /** `h1` cuando el estado ocupa la página entera (404, recurso inexistente). */
  headingLevel?: 'h1' | 'h2'
  className?: string
}

/**
 * Estados vacíos, de error o pendientes con la misma voz visual:
 * un disco dibujado, un título editorial y una acción opcional.
 */
export function StateMessage({
  tone = 'empty',
  eyebrow,
  title,
  children,
  action,
  headingLevel: Heading = 'h2',
  className,
}: StateMessageProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex flex-col items-start gap-5 border-t-2 border-ink py-12 sm:flex-row sm:gap-10', className)}
    >
      <svg aria-hidden viewBox="0 0 64 64" className="size-16 shrink-0">
        <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink" />
        <circle cx="32" cy="32" r="21" fill="none" stroke="currentColor" strokeWidth="0.75" className="text-ink-faint" />
        <circle cx="32" cy="32" r="9" className={tone === 'error' ? 'fill-signal' : 'fill-ink'} />
        <circle cx="32" cy="32" r="1.8" className="fill-paper" />
        {tone === 'error' && <path d="M8 56 56 8" stroke="currentColor" strokeWidth="1.5" className="text-signal" />}
      </svg>
      <div className="max-w-xl">
        <p className={cn('label-mono', tone === 'error' ? 'text-signal' : 'text-ink-faint')}>{eyebrow}</p>
        <Heading className="mt-2 font-display text-2xl leading-tight font-medium tracking-tight sm:text-3xl">{title}</Heading>
        {children && <div className="mt-3 text-ink-soft">{children}</div>}
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  )
}
