import { describeMusicBrainzError } from '@/services/musicbrainz/client'
import { buttonClass } from './buttonStyles'
import { StateMessage } from './StateMessage'

/** Error de consulta a MusicBrainz con opción de reintentar. */
export function LoadError({ error, onRetry, className }: { error: unknown; onRetry: () => void; className?: string }) {
  return (
    <StateMessage
      tone="error"
      eyebrow="Error de conexión"
      title="No hemos podido traer los discos"
      action={
        <button type="button" onClick={onRetry} className={buttonClass('quiet')}>
          Reintentar
        </button>
      }
      className={className}
    >
      {describeMusicBrainzError(error)}
    </StateMessage>
  )
}
