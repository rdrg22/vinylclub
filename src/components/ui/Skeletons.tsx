import { cn } from '@/utils/cn'

/** Rejilla de fundas vacías mientras llegan los resultados. */
export function AlbumGridSkeleton({ count = 10, className }: { count?: number; className?: string }) {
  return (
    <ul
      aria-hidden
      className={cn('grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 md:grid-cols-4 lg:grid-cols-5', className)}
    >
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="animate-pulse" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="aspect-square bg-paper-deep" />
          <div className="mt-3 h-4 w-3/4 bg-paper-deep" />
          <div className="mt-2 h-3 w-1/2 bg-paper-deep" />
        </li>
      ))}
    </ul>
  )
}

/** Filas vacías para listas (artistas, ediciones). */
export function RowsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul aria-hidden className="divide-y divide-rule border-y border-rule">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex animate-pulse items-center gap-4 py-4" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="size-14 shrink-0 bg-paper-deep" />
          <div className="flex-1">
            <div className="h-4 w-1/3 bg-paper-deep" />
            <div className="mt-2 h-3 w-1/2 bg-paper-deep" />
          </div>
        </li>
      ))}
    </ul>
  )
}
