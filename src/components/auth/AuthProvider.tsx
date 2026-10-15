/**
 * Sesión del usuario con Firebase Auth (email y contraseña). Firebase recuerda la
 * sesión en este navegador y la renueva sola. Sin Firebase configurado, estado `demo`.
 */
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  type User,
} from 'firebase/auth'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { auth } from '@/services/firebase'
import { AuthContext, type AuthApi, type AuthState } from './authContext'

const stateFrom = (user: User | null): AuthState =>
  user ? { status: 'signed-in', user: { id: user.uid, email: user.email ?? '' } } : { status: 'signed-out' }

/** Errores de Firebase Auth traducidos; los desconocidos, genéricos (sin detalles internos). */
export function authMessage(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : ''
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email o contraseña incorrectos.'
    case 'auth/email-already-in-use':
      return 'Ya hay una cuenta con ese email. Prueba a entrar.'
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements':
      return 'La contraseña es demasiado débil: usa al menos 8 caracteres.'
    case 'auth/invalid-email':
    case 'auth/missing-email':
      return 'Revisa el email: no parece válido.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos seguidos. Espera un momento y vuelve a probar.'
    case 'auth/network-request-failed':
      return 'No hay conexión con el servidor de cuentas.'
    case 'auth/operation-not-allowed':
      return 'El acceso con email y contraseña no está activado en Firebase.'
    case 'auth/requires-recent-login':
      return 'Por seguridad, vuelve a entrar antes de cambiar la contraseña.'
    case 'auth/user-disabled':
      return 'Esta cuenta está desactivada.'
  }
  return 'No se ha podido completar. Inténtalo de nuevo.'
}

const NOT_ENABLED = 'Las cuentas no están activadas.'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(auth ? { status: 'loading' } : { status: 'demo' })

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (user) => setState(stateFrom(user)))
  }, [])

  const api = useMemo<AuthApi>(
    () => ({
      state,
      async signIn(email, password) {
        if (!auth) return NOT_ENABLED
        try {
          await signInWithEmailAndPassword(auth, email.trim(), password)
          return null
        } catch (error) {
          return authMessage(error)
        }
      },
      async signUp(email, password) {
        if (!auth) return { error: NOT_ENABLED, confirm: false }
        try {
          // Firebase inicia sesión directamente al crear la cuenta.
          await createUserWithEmailAndPassword(auth, email.trim(), password)
          return { error: null, confirm: false }
        } catch (error) {
          return { error: authMessage(error), confirm: false }
        }
      },
      async sendPasswordReset(email) {
        if (!auth) return NOT_ENABLED
        try {
          // El enlace abre la página de Firebase para elegir contraseña nueva.
          await sendPasswordResetEmail(auth, email.trim())
          return null
        } catch (error) {
          const message = authMessage(error)
          // No se revela si el email tiene cuenta o no.
          return message === 'Email o contraseña incorrectos.' ? null : message
        }
      },
      async updatePassword(password) {
        if (!auth?.currentUser) return NOT_ENABLED
        try {
          await updatePassword(auth.currentUser, password)
          return null
        } catch (error) {
          return authMessage(error)
        }
      },
      async signOut() {
        if (auth) await signOut(auth)
      },
    }),
    [state],
  )

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>
}
