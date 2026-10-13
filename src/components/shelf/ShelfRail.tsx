import { useCallback, useEffect, useRef, useState } from 'react'
import type { Album } from '@/types/music'
import { AlbumTile } from '@/components/album/AlbumTile'
import { cn } from '@/utils/cn'

interface ShelfRailProps {
  albums: Album[]
  label: string
  /** Las primeras estanterías cargan sus portadas sin esperar al scroll. */
  eager?: boolean
}

/** Fila horizontal de fundas apoyadas sobre una balda. */
export function ShelfRail({ albums, label, eager = false }: ShelfRailProps) {
  const railRef = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })

  const updateEdges = useCallback(() => {
    const rail = railRef.current
    if (!rail) return
    const start = rail.scrollLeft <= 4
    const end = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }))
  }, [])

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    updateEdges()
    const observer = new ResizeObserver(updateEdges)
    observer.observe(rail)
    return () => observer.disconnect()
  }, [updateEdges, albums.length])

  const scroll = (direction: 1 | -1) => {
    const rail = railRef.current
    rail?.scrollBy({ left: direction * rail.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      {/* La balda: canto de tinta bajo las fundas. Su altura sigue el tamaño de las fundas (w-36/44/48). */}
      <div
        aria-hidden
        className="absolute -inset-x-4 top-[11.5rem] h-2.5 border-t-2 border-ink bg-paper-deep sm:-inset-x-8 sm:top-[13.5rem] lg:top-[14.5rem]"
      />

      <ul
        ref={railRef}
        onScroll={updateEdges}
        aria-label={label}
        className="no-scrollbar relative -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pt-10 pb-1 sm:-mx-8 sm:scroll-px-8 sm:gap-6 sm:px-8"
      >
        {albums.map((album, index) => (
          <li key={album.id} className="w-36 shrink-0 snap-start sm:w-44 lg:w-48">
            <AlbumTile album={album} eager={eager && index < 6} />
          </li>
        ))}
      </ul>

      <div className="pointer-events-none absolute inset-x-0 top-10 hidden h-44 items-center justify-between md:flex lg:h-48">
        <RailButton direction={-1} hidden={edges.start} onClick={() => scroll(-1)} />
        <RailButton direction={1} hidden={edges.end} onClick={() => scroll(1)} />
      </div>
    </div>
  )
}

function RailButton({ direction, hidden, onClick }: { direction: 1 | -1; hidden: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden}
      aria-label={direction === 1 ? 'Ver más discos' : 'Ver discos anteriores'}
      className={cn(
        'pointer-events-auto grid size-11 place-items-center rounded-full bg-ink text-paper shadow-lg transition-all duration-300 ease-out-soft hover:bg-signal',
        direction === 1 ? '-mr-3 sm:-mr-5' : '-ml-3 sm:-ml-5',
        hidden && 'pointer-events-none scale-90 opacity-0',
      )}
    >
      <span aria-hidden>{direction === 1 ? '→' : '←'}</span>
    </button>
  )
}
