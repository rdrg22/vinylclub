/**
 * Firebase (cuentas con Firebase Auth y colección en Firestore). Solo se inicializa si
 * hay configuración en el entorno; sin ella la app funciona en modo demostración.
 * La configuración web es pública por diseño: lo que protege los datos son las reglas
 * de Firestore (firestore.rules), que solo dejan a cada usuario tocar lo suyo.
 */
import { initializeApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { env, isDemoMode } from '@/config/env'

const app = isDemoMode
  ? null
  : initializeApp({
      apiKey: env.firebase.apiKey,
      authDomain: env.firebase.authDomain,
      projectId: env.firebase.projectId,
      appId: env.firebase.appId,
    })

export const auth: Auth | null = app ? getAuth(app) : null
export const db: Firestore | null = app ? getFirestore(app) : null

if (auth) auth.languageCode = 'es' // emails de recuperación en español
