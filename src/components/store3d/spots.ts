/**
 * Marcas del suelo: los únicos sitios a los que se puede ir en la tienda. Al pulsar una,
 * la cámara se desliza hasta allí y mira hacia lo que señala su flecha.
 *
 * Ángulos (yaw) como los de la cámara: 0 mira a −Z (al fondo), +π/2 a −X (pared
 * izquierda) y −π/2 a +X (pared derecha).
 */
import type { DecorLayout } from './decorLayout'
import { COLLECTION_KEY, EYE_HEIGHT, START, WISHLIST_KEY, type UnitLayout } from './layout'

export interface FloorSpot {
  id: string
  label: string
  /** Centro de la marca en el suelo. */
  x: number
  z: number
  /** Hacia dónde apunta la flecha (y hacia dónde se mira al llegar). */
  facing: number
  /**
   * Adónde va la cámara. `decade`: el encuadre del mueble entero (depende del ancho de
   * la pantalla, lo calcula la tienda). `entrance`: el punto de partida.
   */
  target: { kind: 'decade'; decade: string } | { kind: 'entrance' } | { kind: 'view'; x: number; y: number; z: number; yaw: number; pitch?: number }
}

/** Distancia de la marca al centro del pasillo, hacia su estantería. */
const AISLE_OFFSET = 0.95
/** A qué distancia de la gramola y de las cubetas se queda uno mirándolas. */
const DECOR_DISTANCE = 1.7

export const ENTRANCE_SPOT = 'entrada'

export function buildFloorSpots(units: UnitLayout[], decor: DecorLayout): FloorSpot[] {
  const spots: FloorSpot[] = [
    {
      id: ENTRANCE_SPOT,
      label: 'Entrada',
      x: START.position[0],
      z: START.position[2],
      facing: START.yaw,
      target: { kind: 'entrance' },
    },
  ]

  // Gramola en la pared derecha: se mira hacia +X.
  const jx = decor.jukebox.x - DECOR_DISTANCE
  spots.push({
    id: 'gramola',
    label: 'Gramola',
    x: jx,
    z: decor.jukebox.z,
    facing: -Math.PI / 2,
    target: { kind: 'view', x: jx, y: EYE_HEIGHT, z: decor.jukebox.z, yaw: -Math.PI / 2, pitch: -0.12 },
  })

  // Cubetas en la pared izquierda: una marca entre las dos, mirando a −X y un poco hacia abajo.
  if (decor.crates.length > 0) {
    const cz = decor.crates.reduce((sum, c) => sum + c.z, 0) / decor.crates.length
    const cx = (decor.crates[0]?.x ?? 0) + DECOR_DISTANCE
    spots.push({
      id: 'cubetas',
      label: 'Los nº 1',
      x: cx,
      z: cz,
      facing: Math.PI / 2,
      target: { kind: 'view', x: cx, y: EYE_HEIGHT, z: cz, yaw: Math.PI / 2, pitch: -0.45 },
    })
  }

  for (const unit of units) {
    const left = unit.side === 'left'
    spots.push({
      id: unit.decade,
      label: unit.decade === COLLECTION_KEY ? 'Tu colección' : unit.decade === WISHLIST_KEY ? 'Lo quiero' : unit.label,
      x: left ? -AISLE_OFFSET : AISLE_OFFSET,
      z: unit.center[2],
      facing: left ? Math.PI / 2 : -Math.PI / 2,
      target: { kind: 'decade', decade: unit.decade },
    })
  }

  const view = decor.counterView
  spots.push({
    id: 'mostrador',
    label: 'Mostrador del DJ',
    x: view.x,
    z: view.z,
    facing: view.yaw,
    target: { kind: 'view', x: view.x, y: view.y, z: view.z, yaw: view.yaw, pitch: view.pitch },
  })

  return spots
}
