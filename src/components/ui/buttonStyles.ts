import { cn } from '@/utils/cn'

type Variant = 'primary' | 'quiet'

const BASE =
  'inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium transition-[background-color,color,transform] duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-40'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:bg-signal',
  quiet: 'border border-ink text-ink hover:bg-ink hover:text-paper',
}

/** Clases compartidas por <button> y <Link> con aspecto de botón. */
export function buttonClass(variant: Variant = 'primary', className?: string): string {
  return cn(BASE, VARIANTS[variant], className)
}
