import type { Album } from '@/types/music'

const PRIMARY: Record<string, string> = {
  Album: 'Álbum',
  Single: 'Single',
  EP: 'EP',
  Broadcast: 'Emisión',
  Other: 'Otro',
}

const SECONDARY: Record<string, string> = {
  Compilation: 'Recopilatorio',
  Soundtrack: 'Banda sonora',
  Live: 'Directo',
  Remix: 'Remezclas',
  'DJ-mix': 'Sesión de DJ',
  'Mixtape/Street': 'Mixtape',
  Demo: 'Maqueta',
  Interview: 'Entrevista',
  Spokenword: 'Palabra hablada',
  Audiobook: 'Audiolibro',
  'Audio drama': 'Radioteatro',
  'Field recording': 'Grabación de campo',
}

/** Tipos de MusicBrainz en castellano: «Álbum · Directo». Vacío si la fuente no los da. */
export function describeReleaseTypes(album: Pick<Album, 'primaryType' | 'secondaryTypes'>): string {
  const parts = [
    album.primaryType ? (PRIMARY[album.primaryType] ?? album.primaryType) : undefined,
    ...(album.secondaryTypes ?? []).map((type) => SECONDARY[type] ?? type),
  ]
  return parts.filter(Boolean).join(' · ')
}
