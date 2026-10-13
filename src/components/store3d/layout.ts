/**
 * Geometría de la tienda 3D (en metros). Un pasillo central a lo largo de −Z con
 * un mueble por década, alternando pared izquierda y derecha en orden cronológico.
 *
 * Cada mueble se describe en coordenadas locales: x a lo largo de la pared
 * (izquierda → derecha vista de frente), y hacia arriba, z hacia el pasillo.
 * Cada balda lleva dos años: el primero a la izquierda y el segundo a la derecha,
 * ordenados por puesto en la lista.
 */
import type { Album } from '@/types/music'
import type { Decade } from '@/types/shelf'

export const EYE_HEIGHT = 1.6
export const COVER_SIZE = 0.31
export const COVER_PITCH = 0.32
export const PER_HALF = 10
export const HALF_GAP = 0.2
export const UNIT_WIDTH = PER_HALF * COVER_PITCH * 2 + HALF_GAP
/** Alturas de las baldas, de arriba abajo. */
export const ROW_Y = [2.05, 1.67, 1.29, 0.91, 0.53] as const
export const WALL_X = 3.2
const UNIT_PITCH_Z = UNIT_WIDTH + 1
const FIRST_UNIT_Z = -(UNIT_WIDTH / 2) - 1.5
const VIEW_DISTANCE = 3.3

export const START = { position: [0, EYE_HEIGHT, 4.5] as const, yaw: 0 }
/** Pantalla de inicio: en el umbral de la puerta, mirando al pasillo. */
export const INTRO = { position: [0, EYE_HEIGHT + 0.05, 5.4] as const, yaw: 0 }
/** Al pulsar «Entrar», la cámara camina hasta aquí. */
export const ENTER = { position: [0, EYE_HEIGHT, 1.2] as const, yaw: 0 }

export interface CoverSlot {
  album: Album
  /** Posición local dentro del mueble. */
  x: number
  y: number
}

export interface YearTag {
  year: number
  x: number
  y: number
}

export interface UnitLayout {
  decade: Decade
  label: string
  side: 'left' | 'right'
  /** Centro del mueble en el mundo (a ras de suelo). */
  center: [number, number, number]
  /** Giro del mueble: su +z local apunta al pasillo. */
  rotationY: number
  slots: CoverSlot[]
  yearTags: YearTag[]
  /** Desde dónde se ve el mueble entero al «ir» a esa década. */
  viewpoint: { position: [number, number, number]; yaw: number }
}

export interface DecadeInput {
  decade: Decade
  label: string
  /** Discos de la década con su año de entrada en la lista y su puesto. */
  albums: Array<{ album: Album; year: number; rank: number }>
}

export function buildStoreLayout(decades: DecadeInput[]): UnitLayout[] {
  return decades.map((input, index) => {
    const side = index % 2 === 0 ? 'left' : 'right'
    const z = FIRST_UNIT_Z - Math.floor(index / 2) * UNIT_PITCH_Z
    const x = side === 'left' ? -WALL_X : WALL_X
    // Izquierda: mira a +X (giro +90°). Derecha: mira a −X (giro −90°).
    const rotationY = side === 'left' ? Math.PI / 2 : -Math.PI / 2

    const years = [...new Set(input.albums.map((a) => a.year))].sort((a, b) => a - b).slice(0, ROW_Y.length * 2)
    const rows = Math.ceil(years.length / 2)
    const firstRow = Math.floor((ROW_Y.length - rows) / 2)

    const slots: CoverSlot[] = []
    const yearTags: YearTag[] = []
    years.forEach((year, yearIndex) => {
      const y = ROW_Y[firstRow + Math.floor(yearIndex / 2)]!
      const half = yearIndex % 2
      const left = -UNIT_WIDTH / 2 + half * (PER_HALF * COVER_PITCH + HALF_GAP)
      yearTags.push({ year, x: left + 0.18, y })
      input.albums
        .filter((a) => a.year === year)
        .sort((a, b) => a.rank - b.rank)
        .slice(0, PER_HALF)
        .forEach(({ album }, k) => slots.push({ album, x: left + k * COVER_PITCH + COVER_PITCH / 2, y }))
    })

    return {
      decade: input.decade,
      label: input.label,
      side,
      center: [x, 0, z],
      rotationY,
      slots,
      yearTags,
      viewpoint: {
        position: [x + (side === 'left' ? VIEW_DISTANCE : -VIEW_DISTANCE), EYE_HEIGHT - 0.1, z],
        // Con la cámara mirando a −Z en yaw 0, mirar a −X es +90°: coincide con el giro del mueble.
        yaw: rotationY,
      },
    }
  })
}

/** Límites del pasillo por los que se puede caminar. */
export function walkBounds(units: UnitLayout[]) {
  const lastZ = Math.min(...units.map((u) => u.center[2]), 0)
  return { minX: -WALL_X + 0.9, maxX: WALL_X - 0.9, minZ: lastZ - UNIT_WIDTH / 2 - 1.2, maxZ: START.position[2] + 1 }
}

/** Fondo de la tienda (pared del cartel principal). */
export const backWallZ = (units: UnitLayout[]) => walkBounds(units).minZ - 1.2
