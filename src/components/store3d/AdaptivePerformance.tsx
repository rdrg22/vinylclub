/**
 * Ajuste automático de resolución. Mide los fps reales durante la visita y, si el equipo
 * no llega, baja poco a poco la resolución de render (hasta 1 píxel por píxel de pantalla)
 * dentro de la calidad elegida. La calidad en sí no la cambia nunca: eso se hace en Ajustes.
 * Ignora los fotogramas con la pestaña oculta o tras un parón (carga de texturas,
 * cambio de pestaña), que no dicen nada de la fluidez real.
 */
import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'

const WINDOW = 2 // segundos por medición
const TARGET_FPS = 45 // por debajo, se baja resolución
const DPR_STEP = 0.25

export function AdaptivePerformance() {
  const setDpr = useThree((s) => s.setDpr)
  const acc = useRef({ time: 0, frames: 0, warmup: 3 })

  useFrame((state, dt) => {
    const a = acc.current
    if (document.hidden || dt > 0.25) return
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
    }
  })
  return null
}
