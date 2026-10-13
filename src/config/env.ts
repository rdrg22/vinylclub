const clean = (value: string | undefined) => value?.trim() || undefined

export const env = {
  supabaseUrl: clean(import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: clean(import.meta.env.VITE_SUPABASE_ANON_KEY),
  musicBrainzContact: clean(import.meta.env.VITE_MUSICBRAINZ_CONTACT),
} as const

/** Sin credenciales de Supabase la app funciona con datos de ejemplo locales. */
export const isDemoMode = !(env.supabaseUrl && env.supabaseAnonKey)
