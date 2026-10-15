/**
 * Ajuste automático de rendimiento. Mide los fps reales durante la visita y, si el
 * equipo no llega:
 *   1. baja la resolución de render poco a poco (hasta 1 píxel por píxel de pantalla);
 *   2. si aun así va a tirones, pide pasar a calidad ligera (solo si el visitante no
 *      eligió la calidad a mano).
 * Ignora los fotogramas con la pestaña oculta o tras un parón (carga de texturas,
 * cambio de pestaña), que no dicen nada de la fluidez real.
 */
import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'

const WINDOW = 2 // segundos por medición
const TARGET_FPS = 45 // por debajo, se baja resolución
const MIN_FPS = 28 // por debajo y ya a resolución mínima, se pide calidad ligera
const DPR_STEP = 0.25

interface Props {
  /** Se llama una vez si ni bajando la resolución se alcanza un mínimo fluido. */
  onTooSlow?: () => void
}

export function AdaptivePerformance({ onTooSlow }: Props) {
  const setDpr = useThree((s) => s.setDpr)
  const acc = useRef({ time: 0, frames: 0, warmup: 3, slowWindows: 0, done: false })

  useFrame((state, dt) => {
    const a = acc.current
    if (a.done || document.hidden || dt > 0.25) return
    // Los primeros segundos compilan shaders y suben texturas: no cuentan.
    if (a.warmup > 0) {
      a.warmup -= dt
      return
    }
    a.time += dt
    a.frames += 1
    if (a.time < WINDOW) return
    const fps = a.frames / a.time
    a.time = 0
    a.frames = 0

    const dpr = state.viewport.dpr
    if (fps < TARGET_FPS && dpr > 1) {
      setDpr(Math.max(1, dpr - DPR_STEP))
      a.warmup = 0.5
      return
    }
    if (fps < MIN_FPS && onTooSlow) {
      // Dos mediciones seguidas: un tirón puntual no basta para cambiar de calidad.
      a.slowWindows += 1
      if (a.slowWindows >= 2) {
        a.done = true
        onTooSlow()
      }
    } else {
      a.slowWindows = 0
    }
  })
  return null
}
