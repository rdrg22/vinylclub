/**
 * Dónde va cada elemento decorativo de la tienda y con qué discos (siempre reales:
 * los pósters y las cubetas usan números 1 de las listas de Billboard).
 */
import type { Album } from '@/types/music'
import { backWallZ, EYE_HEIGHT, START, UNIT_WIDTH, WALL_X, walkBounds, type UnitLayout } from './layout'
import type { Obstacle } from './navigation'

export const COUNTER = { width: 3.2, height: 1.0, depth: 0.7 }
/** Altura del plato del tocadiscos sobre el suelo. */
export const PLATTER_Y = COUNTER.height + 0.11

export interface PosterSpot {
  album: Album
  year: number
  decadeLabel: string
  x: number
  z: number
  rotationY: number
}

export interface CrateSpot {
  label: string
  albums: Album[]
  x: number
  z: number
  rotationY: number
}

export interface DecorLayout {
  counter: { x: number; z: number }
  /** Centro del plato del tocadiscos, en el mundo. */
  turntable: { x: number; y: number; z: number }
  /** Desde dónde se ve el mostrador al llevar un disco al tocadiscos. */
  counterView: { x: number; y: number; z: number; yaw: number; pitch: number }
  jukebox: { x: number; z: number; rotationY: number }
  crates: CrateSpot[]
  posters: PosterSpot[]
  rug: { x: number; z: number }
  obstacles: Obstacle[]
}

const firstChart = (a: Album) => a.charts?.[0]
const numberOnes = (albums: Album[]) =>
  albums.filter((a) => a.source === 'musicbrainz' && a.charts?.some((c) => c.rank === 1))

/** El nº 1 más duradero de la década: más años en la lista; a igualdad, el primero. */
function decadeIcon(albums: Album[]): { album: Album; year: number } | null {
  const candidates = numberOnes(albums)
  const best = [...candidates].sort(
    (a, b) => (b.charts?.length ?? 0) - (a.charts?.length ?? 0) || (firstChart(a)?.year ?? 0) - (firstChart(b)?.year ?? 0),
  )[0]
  const year = best?.charts?.find((c) => c.rank === 1)?.year
  return best && year ? { album: best, year } : null
}

export function buildDecorLayout(units: UnitLayout[], albumsByDecade: Record<string, Album[]>): DecorLayout {
  const back = backWallZ(units)
  const bounds = walkBounds(units)
  const counterZ = back + 0.9

  // Pósters: en el hueco de pared que queda tras cada mueble, en su mismo lado.
  const posters: PosterSpot[] = []
  for (const unit of units) {
    const icon = decadeIcon(albumsByDecade[unit.decade] ?? [])
    if (!icon) continue
    const left = unit.side === 'left'
    posters.push({
      ...icon,
      decadeLabel: unit.label,
      x: left ? -WALL_X - 0.17 : WALL_X + 0.17,
      z: unit.center[2] - UNIT_WIDTH / 2 - 0.5,
      rotationY: left ? Math.PI / 2 : -Math.PI / 2,
    })
  }

  // Cubetas en la entrada con los nº 1 de cada año, ordenados por fecha.
  const ones = numberOnes(Object.values(albumsByDecade).flat()).sort((a, b) => (firstChart(a)?.year ?? 0) - (firstChart(b)?.year ?? 0))
  const half = Math.ceil(ones.length / 2)
  const crateX = -WALL_X + 0.75
  const crates: CrateSpot[] = [
    { label: 'Los nº 1 · 1956–1989', albums: ones.slice(0, half).slice(-12), x: crateX, z: 2.9, rotationY: Math.PI / 2 },
    { label: 'Los nº 1 · 1990–2025', albums: ones.slice(half).slice(-12), x: crateX, z: 1.0, rotationY: Math.PI / 2 },
  ]

  const jukebox = { x: WALL_X - 0.6, z: 1.9, rotationY: -Math.PI / 2 }

  return {
    counter: { x: 0, z: counterZ },
    turntable: { x: 0.75, y: PLATTER_Y, z: counterZ },
    counterView: {
      x: 0,
      y: EYE_HEIGHT,
      z: bounds.minZ,
      yaw: 0,
      // Mirar hacia el plato desde la posición más cercana permitida.
      pitch: -Math.atan2(EYE_HEIGHT - PLATTER_Y, bounds.minZ - counterZ),
    },
    jukebox,
    crates,
    posters,
    rug: { x: 0, z: (START.position[2] + units[0]!.center[2] + UNIT_WIDTH / 2) / 2 },
    obstacles: [
      { x: jukebox.x, z: jukebox.z, r: 0.85 },
      ...crates.map((c) => ({ x: c.x, z: c.z, r: 0.75 })),
    ],
  }
}
