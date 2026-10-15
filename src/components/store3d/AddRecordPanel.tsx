/**
 * Ventana para añadir un disco a la colección desde la tienda (al pulsar el hueco «+»):
 * buscador por código de barras (escrito o escaneado) o por título.
 */
import { useAuth } from '@/components/auth/authContext'
import { AddRecord } from '@/components/collection/AddRecord'
import { useCollection } from '@/components/collection/collectionContext'
import { StoreWindow, storeButtonPrimary } from './StoreWindow'

interface Props {
  onClose: () => void
  /** Sin sesión: abrir la ventana de la cuenta. */
  onSignIn: () => void
}

export function AddRecordPanel({ onClose, onSignIn }: Props) {
  const auth = useAuth()
  const { items, where } = useCollection()
  const signedOut = auth.state.status === 'signed-out'

  return (
    <StoreWindow
      title="Añadir a tu colección"
      badge="+"
      subtitle={
        signedOut
          ? 'Necesitas una cuenta'
          : `${items.length === 1 ? '1 disco' : `${items.length} discos`}${where === 'browser' ? ' · solo en este navegador' : ''}`
      }
      footer="Datos de MusicBrainz · Esc para cerrar"
      onClose={onClose}
    >
      {signedOut ? (
        <div className="space-y-4">
          <p className="text-[#f3e4c3]/85">Entra con tu cuenta para registrar tus discos: aparecerán aquí, en esta estantería.</p>
          <button type="button" onClick={onSignIn} className={storeButtonPrimary}>
            Entrar o crear cuenta
          </button>
        </div>
      ) : auth.state.status === 'loading' ? (
        <p className="label-mono text-[#e8c98f]/80">Comprobando tu sesión…</p>
      ) : (
        <AddRecord variant="panel" />
      )}
    </StoreWindow>
  )
}
