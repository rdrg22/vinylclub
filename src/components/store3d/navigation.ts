/**
 * Estado de navegación en primera persona. Es un objeto mutable (no estado de React)
 * porque se lee y escribe en cada fotograma; la entrada (teclado, ratón, táctil,
 * botones del HUD) lo modifica y el bucle de render lo aplica a la cámara.
 */
import { EYE_HEIGHT, START } from './layout'

export interface NavState {
  x: number
  y: number
  z: number
  yaw: number
  pitch: number
  /** Teclas pulsadas (KeyW, ArrowUp…). */
  keys: Set<string>
  /** −1 / 0 / 1 desde los botones táctiles de caminar. */
  walk: number
  /** Destino de un «ir a la década»: la cámara se desliza hasta él. */
  fly: { x: number; y: number; z: number; yaw: number } | null
}

export function createNavState(): NavState {
  const [x, y, z] = START.position
  return { x, y, z, yaw: START.yaw, pitch: -0.04, keys: new Set(), walk: 0, fly: null }
}

export const WALK_SPEED = 2.4 // m/s
export const TURN_SPEED = 1.6 // rad/s
export const LOOK_SENSITIVITY = 0.0045
export const MAX_PITCH = 0.7

const FORWARD = ['KeyW', 'ArrowUp']
const BACK = ['KeyS', 'ArrowDown']
const STRAFE_LEFT = ['KeyA']
const STRAFE_RIGHT = ['KeyD']
const TURN_LEFT = ['ArrowLeft', 'KeyQ']
const TURN_RIGHT = ['ArrowRight', 'KeyE']
export const NAV_KEYS = new Set([...FORWARD, ...BACK, ...STRAFE_LEFT, ...STRAFE_RIGHT, ...TURN_LEFT, ...TURN_RIGHT])

const pressed = (nav: NavState, codes: string[]) => codes.some((c) => nav.keys.has(c))

/** Avanza la simulación `dt` segundos dentro de los límites del pasillo. */
export function stepNavigation(
  nav: NavState,
  dt: number,
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  reducedMotion: boolean,
) {
  if (nav.fly) {
    const t = reducedMotion ? 1 : Math.min(1, dt * 3.2)
    nav.x += (nav.fly.x - nav.x) * t
    nav.y += (nav.fly.y - nav.y) * t
    nav.z += (nav.fly.z - nav.z) * t
    // Giro por el camino más corto.
    const diff = Math.atan2(Math.sin(nav.fly.yaw - nav.yaw), Math.cos(nav.fly.yaw - nav.yaw))
    nav.yaw += diff * t
    nav.pitch += (-0.06 - nav.pitch) * t
    if (Math.abs(nav.fly.x - nav.x) + Math.abs(nav.fly.z - nav.z) + Math.abs(diff) < 0.01) nav.fly = null
    return
  }

  if (pressed(nav, TURN_LEFT)) nav.yaw += TURN_SPEED * dt
  if (pressed(nav, TURN_RIGHT)) nav.yaw -= TURN_SPEED * dt

  let forward = nav.walk
  if (pressed(nav, FORWARD)) forward += 1
  if (pressed(nav, BACK)) forward -= 1
  let strafe = 0
  if (pressed(nav, STRAFE_RIGHT)) strafe += 1
  if (pressed(nav, STRAFE_LEFT)) strafe -= 1

  if (forward || strafe) {
    const sin = Math.sin(nav.yaw)
    const cos = Math.cos(nav.yaw)
    // yaw 0 mira a −Z; la derecha es +X.
    nav.x += (-sin * forward + cos * strafe) * WALK_SPEED * dt
    nav.z += (-cos * forward - sin * strafe) * WALK_SPEED * dt
  }
  nav.x = Math.min(bounds.maxX, Math.max(bounds.minX, nav.x))
  nav.z = Math.min(bounds.maxZ, Math.max(bounds.minZ, nav.z))
  nav.y += (EYE_HEIGHT - nav.y) * Math.min(1, dt * 4)
}
