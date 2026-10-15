const clean = (value: string | undefined) => value?.trim() || undefined

export const env = {
  /** Configuración web de Firebase. Son identificadores públicos: la seguridad la ponen las reglas de Firestore. */
  firebase: {
    apiKey: clean(import.meta.env.VITE_FIREBASE_API_KEY),
    authDomain: clean(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
    projectId: clean(import.meta.env.VITE_FIREBASE_PROJECT_ID),
    appId: clean(import.meta.env.VITE_FIREBASE_APP_ID),
  },
  musicBrainzContact: clean(import.meta.env.VITE_MUSICBRAINZ_CONTACT),
} as const

/** Sin la configuración de Firebase la app funciona sin cuentas (modo demostración). */
export const isDemoMode = !(env.firebase.apiKey && env.firebase.authDomain && env.firebase.projectId && env.firebase.appId)
