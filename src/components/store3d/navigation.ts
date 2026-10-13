/**
 * Estado de navegación en primera persona. Es un objeto mutable (no estado de React)
 * porque se lee y escribe en cada fotograma; la entrada (teclado, ratón, táctil,
 * botones del HUD) lo modifica y el bucle de render lo aplica a la cámara.
 */
import { EYE_HEIGHT, INTRO, START } from './layout'

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
  /** Destino de un «ir a…»: la cámara se desliza hasta él (inclinación opcional). */
  fly: { x: number; y: number; z: number; yaw: number; pitch?: number } | null
  /** Pantalla de inicio: la cámara se mece sola y no responde a la entrada. */
  intro: boolean
  /** Con un disco en la mano la cámara se queda quieta (el arrastre gira el disco). */
  locked: boolean
}

export function createNavState(intro: boolean): NavState {
  const [x, y, z] = (intro ? INTRO : START).position
  return { x, y, z, yaw: START.yaw, pitch: intro ? 0.04 : -0.04, keys: new Set(), walk: 0, fly: null, intro, locked: false }
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

/** Muebles del pasillo que no se pueden atravesar (círculos en planta). */
export interface Obstacle {
  x: number
  z: number
  r: number
}

export interface WalkArea {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  obstacles?: Obstacle[]
}

/** Avanza la simulación `dt` segundos dentro de los límites del pasillo. */
export function stepNavigation(
  nav: NavState,
  dt: number,
  bounds: WalkArea,
  reducedMotion: boolean,
  time = 0,
) {
  if (nav.intro) {
    // Vistazo lento a la tienda, como quien se asoma por la puerta.
    if (!reducedMotion) nav.yaw = Math.sin(time * 0.22) * 0.16
    return
  }
  if (nav.fly) {
    const t = reducedMotion ? 1 : Math.min(1, dt * 3.2)
    nav.x += (nav.fly.x - nav.x) * t
    nav.y += (nav.fly.y - nav.y) * t
    nav.z += (nav.fly.z - nav.z) * t
    // Giro por el camino más corto.
    const diff = Math.atan2(Math.sin(nav.fly.yaw - nav.yaw), Math.cos(nav.fly.yaw - nav.yaw))
    nav.yaw += diff * t
    nav.pitch += ((nav.fly.pitch ?? -0.06) - nav.pitch) * t
    if (Math.abs(nav.fly.x - nav.x) + Math.abs(nav.fly.z - nav.z) + Math.abs(diff) < 0.01) nav.fly = null
    return
  }
  if (nav.locked) return

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
  // Si se choca con un mueble, se le empuja hasta su borde.
  for (const o of bounds.obstacles ?? []) {
    const dx = nav.x - o.x
    const dz = nav.z - o.z
    const distance = Math.hypot(dx, dz)
    if (distance < o.r && distance > 0.0001) {
      nav.x = o.x + (dx / distance) * o.r
      nav.z = o.z + (dz / distance) * o.r
    }
  }
  nav.y += (EYE_HEIGHT - nav.y) * Math.min(1, dt * 4)
}
