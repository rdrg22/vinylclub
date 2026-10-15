/** Ventana de la cuenta en la tienda: entrar / crear cuenta, o tu perfil con la sesión abierta. */
import { useAuth } from '@/components/auth/authContext'
import { AuthForm } from '@/components/auth/AuthForm'
import { useCollection } from '@/components/collection/collectionContext'
import { StoreWindow, storeButton, storeButtonPrimary } from './StoreWindow'

interface Props {
  onClose: () => void
  /** Ir a la estantería «Colección». */
  onGoToCollection: () => void
}

export function AccountWindow({ onClose, onGoToCollection }: Props) {
  const auth = useAuth()
  const { items } = useCollection()
  const count = items.length === 1 ? '1 disco' : `${items.length} discos`

  if (auth.state.status === 'signed-in') {
    return (
      <StoreWindow title="Tu perfil" badge="♪" subtitle="Sesión iniciada" onClose={onClose}>
        <p className="truncate text-lg">{auth.state.user.email}</p>
        <p className="label-mono mt-1 text-[#e8c98f]/80">{count} en tu colección</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={onGoToCollection} className={storeButtonPrimary}>
            Ir a mi colección
          </button>
          <button
            type="button"
            onClick={() => {
              void auth.signOut()
              onClose()
            }}
            className={storeButton}
          >
            Cerrar sesión
          </button>
        </div>
      </StoreWindow>
    )
  }

  if (auth.state.status === 'demo') {
    return (
      <StoreWindow title="Tu perfil" badge="♪" subtitle="Modo demostración" onClose={onClose}>
        <p className="text-[#f3e4c3]/85">
          Las cuentas aún no están activadas en esta copia de la tienda. Tu colección ({count}) se guarda solo en este navegador.
        </p>
        <button type="button" onClick={onGoToCollection} className={`${storeButtonPrimary} mt-5`}>
          Ir a mi colección
        </button>
      </StoreWindow>
    )
  }

  return (
    <StoreWindow
      title="Entrar"
      badge="♪"
      subtitle="Registra los discos que tienes en casa"
      footer="Tu email y contraseña se guardan en Firebase · Esc para cerrar"
      onClose={onClose}
    >
      {auth.state.status === 'loading' ? <p className="label-mono text-[#e8c98f]/80">Comprobando tu sesión…</p> : <AuthForm />}
    </StoreWindow>
  )
}
