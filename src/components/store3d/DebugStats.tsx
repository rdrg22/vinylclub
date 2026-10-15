/**
 * Panel de rendimiento (solo con `?debug` en la dirección): fotogramas por segundo,
 * llamadas de dibujo, triángulos, luces y programas de sombreado. Sirve para medir
 * en el equipo de cada uno y localizar cuellos de botella.
 */
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'

export const debugEnabled = () => new URLSearchParams(window.location.search).has('debug')

export interface FrameStats {
  fps: number
  frameMs: number
  calls: number
  triangles: number
  lights: number
  programs: number
  textures: number
}

/** Publica las estadísticas en `window.__vinylStats` y en un callback (para el panel HTML). */
export function StatsProbe({ onStats }: { onStats: (stats: FrameStats) => void }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const frames = useRef(0)
  const since = useRef(performance.now())
  const worst = useRef(0)
  const last = useRef(performance.now())

  useEffect(() => {
    // Con posprocesado hay varios renders por fotograma: se suman, no se reinician.
    gl.info.autoReset = false
  }, [gl])

  useFrame(() => {
    const now = performance.now()
    worst.current = Math.max(worst.current, now - last.current)
    last.current = now
    frames.current++
    if (now - since.current < 1000) return
    let lights = 0
    scene.traverse((o) => {
      if ((o as { isLight?: boolean }).isLight && o.visible) lights++
    })
    const stats: FrameStats = {
      fps: Math.round((frames.current * 1000) / (now - since.current)),
      frameMs: Math.round(worst.current),
      calls: Math.round(gl.info.render.calls / frames.current),
      triangles: Math.round(gl.info.render.triangles / frames.current),
      lights,
      programs: gl.info.programs?.length ?? 0,
      textures: gl.info.memory.textures,
    }
    ;(window as unknown as { __vinylStats?: FrameStats }).__vinylStats = stats
    onStats(stats)
    gl.info.reset()
    frames.current = 0
    worst.current = 0
    since.current = now
  })
  return null
}
