import type { DataSource } from '@/types/music'
import { cn } from '@/utils/cn'

const COPY: Record<DataSource, string> = {
  musicbrainz: 'Datos de MusicBrainz · portada de Cover Art Archive cuando existe.',
  demo: 'Ficha de ejemplo del modo demostración. No procede de MusicBrainz.',
}

/** Indica siempre de dónde sale la información de un disco. */
export function SourceNote({ source, className }: { source: DataSource; className?: string }) {
  return (
    <p className={cn('label-mono flex items-center gap-2 text-ink-faint', className)}>
      <span aria-hidden className={cn('size-1.5 rounded-full', source === 'demo' ? 'bg-signal' : 'bg-ink-faint')} />
      {COPY[source]}
    </p>
  )
}
