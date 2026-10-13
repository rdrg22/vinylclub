/**
 * DATOS DE EJEMPLO — MODO DEMOSTRACIÓN
 *
 * Discos escritos a mano para poder recorrer la tienda sin Supabase ni red.
 * No proceden de MusicBrainz: no llevan MBID ni portada (se muestra el placeholder)
 * y la interfaz los marca siempre como datos de ejemplo.
 * Solo incluyen título, artista, año de publicación original y tipo.
 */
import type { Album, ReleaseType } from '@/types/music'
import type { Shelf } from '@/types/shelf'

const demo = (
  slug: string,
  title: string,
  artist: string,
  year: number,
  releaseType: ReleaseType = 'album',
): Album => ({ id: `demo-${slug}`, source: 'demo', title, artist, year, releaseType })

const NINETIES_GUITARS: Album[] = [
  demo('nevermind', 'Nevermind', 'Nirvana', 1991),
  demo('goo', 'Goo', 'Sonic Youth', 1990),
  demo('slanted', 'Slanted and Enchanted', 'Pavement', 1992),
  demo('rid-of-me', 'Rid of Me', 'PJ Harvey', 1993),
  demo('superunknown', 'Superunknown', 'Soundgarden', 1994),
  demo('ok-computer', 'OK Computer', 'Radiohead', 1997),
  demo('perfect-from-now-on', 'Perfect From Now On', 'Built to Spill', 1997),
  demo('ten', 'Ten', 'Pearl Jam', 1991),
]

const MODAL_JAZZ: Album[] = [
  demo('kind-of-blue', 'Kind of Blue', 'Miles Davis', 1959),
  demo('mingus-ah-um', 'Mingus Ah Um', 'Charles Mingus', 1959),
  demo('village-vanguard', 'Sunday at the Village Vanguard', 'Bill Evans Trio', 1961),
  demo('monks-dream', "Monk's Dream", 'Thelonious Monk', 1963),
  demo('out-to-lunch', 'Out to Lunch!', 'Eric Dolphy', 1964),
  demo('a-love-supreme', 'A Love Supreme', 'John Coltrane', 1965),
  demo('maiden-voyage', 'Maiden Voyage', 'Herbie Hancock', 1965),
  demo('speak-no-evil', 'Speak No Evil', 'Wayne Shorter', 1966),
]

const NINETIES_ELECTRONIC: Album[] = [
  demo('saw-85-92', 'Selected Ambient Works 85–92', 'Aphex Twin', 1992),
  demo('dubnobass', 'Dubnobasswithmyheadman', 'Underworld', 1994),
  demo('dummy', 'Dummy', 'Portishead', 1994),
  demo('homework', 'Homework', 'Daft Punk', 1997),
  demo('dig-your-own-hole', 'Dig Your Own Hole', 'The Chemical Brothers', 1997),
  demo('mezzanine', 'Mezzanine', 'Massive Attack', 1998),
  demo('mhtrtc', 'Music Has the Right to Children', 'Boards of Canada', 1998),
]

const SEVENTIES_SOUL: Album[] = [
  demo('whats-going-on', "What's Going On", 'Marvin Gaye', 1971),
  demo('superfly', 'Super Fly', 'Curtis Mayfield', 1972, 'soundtrack'),
  demo('lets-stay-together', "Let's Stay Together", 'Al Green', 1972),
  demo('still-bill', 'Still Bill', 'Bill Withers', 1972),
  demo('innervisions', 'Innervisions', 'Stevie Wonder', 1973),
  demo('extension', 'Extension of a Man', 'Donny Hathaway', 1973),
]

const empty = {
  releaseTypes: [],
  decades: [],
  artists: [],
  genres: [],
  styles: [],
  collections: [],
  discovery: null,
} satisfies Shelf['filters']

export const DEMO_SHELVES: Shelf[] = [
  {
    id: 'demo-shelf-90s-guitars',
    name: 'Guitarras de los 90',
    position: 0,
    createdAt: '2026-01-10T10:00:00.000Z',
    filters: { ...empty, releaseTypes: ['album'], decades: ['1990s'], genres: ['rock'], styles: ['grunge', 'indie'] },
  },
  {
    id: 'demo-shelf-jazz',
    name: 'Jazz modal',
    position: 1,
    createdAt: '2026-01-12T10:00:00.000Z',
    filters: { ...empty, releaseTypes: ['album'], decades: ['1960s'], genres: ['jazz'], collections: ['classics'] },
  },
  {
    id: 'demo-shelf-electronic',
    name: 'Electrónica nocturna',
    position: 2,
    createdAt: '2026-01-15T10:00:00.000Z',
    filters: { ...empty, releaseTypes: ['album'], decades: ['1990s'], genres: ['electronic'] },
  },
  {
    id: 'demo-shelf-soul',
    name: 'Soul de los 70',
    position: 3,
    createdAt: '2026-01-20T10:00:00.000Z',
    filters: { ...empty, releaseTypes: ['album', 'soundtrack'], decades: ['1970s'], genres: ['soul'] },
  },
]

export const DEMO_SHELF_ALBUMS: Record<string, Album[]> = {
  'demo-shelf-90s-guitars': NINETIES_GUITARS,
  'demo-shelf-jazz': MODAL_JAZZ,
  'demo-shelf-electronic': NINETIES_ELECTRONIC,
  'demo-shelf-soul': SEVENTIES_SOUL,
}

/** Selección fija para la sección de descubrimiento en modo demostración. */
export const DEMO_DISCOVERY: Album[] = [
  demo('extension', 'Extension of a Man', 'Donny Hathaway', 1973),
  demo('perfect-from-now-on', 'Perfect From Now On', 'Built to Spill', 1997),
  demo('out-to-lunch', 'Out to Lunch!', 'Eric Dolphy', 1964),
  demo('dubnobass', 'Dubnobasswithmyheadman', 'Underworld', 1994),
]
