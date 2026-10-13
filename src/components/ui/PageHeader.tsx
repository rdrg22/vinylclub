import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface PageHeaderProps {
  eyebrow?: ReactNode
  title: string
  children?: ReactNode
  /** Acción alineada a la derecha en escritorio. */
  action?: ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, children, action, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-6 pt-10 pb-6 sm:pt-14', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="label-mono mb-3 text-ink-faint">{eyebrow}</div>}
        <h1 className="font-display text-[clamp(2.75rem,9vw,6.5rem)] leading-[0.9] font-medium tracking-[-0.035em] text-balance">
          {title}
        </h1>
        {children && <div className="mt-4 max-w-2xl text-ink-soft">{children}</div>}
      </div>
      {action}
    </header>
  )
}
