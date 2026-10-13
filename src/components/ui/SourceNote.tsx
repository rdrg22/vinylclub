import type { DataSource } from '@/types/music'
import { cn } from '@/utils/cn'

const COPY: Record<DataSource, string> = {
  musicbrainz: 'Datos de MusicBrainz · portada de Cover Art Archive cuando existe.',
  chart: 'Disco de la lista anual de Billboard. No se ha localizado en MusicBrainz con seguridad: solo se muestran título y artista tal como los publica la lista.',
}

/** Indica siempre de dónde sale la información de un disco. */
export function SourceNote({ source, className }: { source: DataSource; className?: string }) {
  return (
    <p className={cn('label-mono flex items-start gap-2 text-ink-faint', className)}>
      <span aria-hidden className={cn('mt-1 size-1.5 shrink-0 rounded-full', source === 'chart' ? 'bg-signal' : 'bg-ink-faint')} />
      {COPY[source]}
    </p>
  )
}
