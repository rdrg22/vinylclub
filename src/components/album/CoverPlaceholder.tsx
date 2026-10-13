import type { Album } from '@/types/music'
import { cn } from '@/utils/cn'
import { hashString } from '@/utils/hash'

/** Fundas lisas de cartón impreso: una paleta corta y sobria. */
const SLEEVES = [
  { bg: '#1f1d1a', fg: '#efe8da', dot: '#d8402a' },
  { bg: '#cdbf9f', fg: '#1f1d1a', dot: '#1f1d1a' },
  { bg: '#7d3426', fg: '#f3e9d8', dot: '#f3e9d8' },
  { bg: '#344236', fg: '#ede4d0', dot: '#cdbf9f' },
  { bg: '#e2d9c5', fg: '#7d3426', dot: '#7d3426' },
  { bg: '#24303f', fg: '#e9e1cf', dot: '#d8402a' },
] as const

interface CoverPlaceholderProps {
  album: Pick<Album, 'id' | 'title' | 'artist'>
  className?: string
  /** Oculto a lectores de pantalla cuando otra imagen ya describe el disco. */
  decorative?: boolean
}

/** Portada tipográfica para discos sin imagen. No pretende imitar la portada real. */
export function CoverPlaceholder({ album, className, decorative = false }: CoverPlaceholderProps) {
  const hash = hashString(album.id + album.title)
  const sleeve = SLEEVES[hash % SLEEVES.length] ?? SLEEVES[0]
  // Posición del círculo derivada del hash para que cada funda sea distinta.
  const cx = 62 + (hash % 23)
  const cy = 30 + ((hash >> 5) % 22)

  return (
    <div
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : `${album.title} — ${album.artist} (sin portada)`}
      className={cn('@container relative h-full w-full overflow-hidden', className)}
      style={{ backgroundColor: sleeve.bg, color: sleeve.fg }}
    >
      <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <circle cx={cx} cy={cy} r="16" fill="none" stroke={sleeve.fg} strokeOpacity="0.28" strokeWidth="0.6" />
        <circle cx={cx} cy={cy} r="3.2" fill={sleeve.dot} />
      </svg>
      <div className="relative flex h-full flex-col p-[8cqw]">
        <span className="line-clamp-1 font-mono text-[5.6cqw] tracking-[0.08em] uppercase opacity-80">
          {album.artist}
        </span>
        <span className="mt-auto line-clamp-3 font-display text-[11.5cqw] leading-[1.02] font-medium tracking-tight text-balance">
          {album.title}
        </span>
      </div>
    </div>
  )
}
