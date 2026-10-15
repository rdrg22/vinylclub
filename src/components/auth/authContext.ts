import { createContext, useContext } from 'react'

export interface AccountUser {
  id: string
  email: string
}

/**
 * - `loading`: comprobando si hay sesión guardada.
 * - `demo`: no hay Firebase configurado; sin cuentas (la colección vive en este navegador).
 */
export type AuthState =
  | { status: 'loading' }
  | { status: 'demo' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: AccountUser }

export interface AuthApi {
  state: AuthState
  /** Devuelve un mensaje de error en español, o null si ha ido bien. */
  signIn: (email: string, password: string) => Promise<string | null>
  /** Entrar (o crear la cuenta) con Google en una ventana emergente. */
  signInWithGoogle: () => Promise<string | null>
  /** `confirm`: hay que confirmar el email antes de entrar. */
  signUp: (email: string, password: string) => Promise<{ error: string | null; confirm: boolean }>
  sendPasswordReset: (email: string) => Promise<string | null>
  /** Nueva contraseña (al volver del enlace de recuperación, con sesión ya iniciada). */
  updatePassword: (password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthApi | null>(null)

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
