/**
 * Calidad gráfica de la tienda 3D.
 * - `high`: texturas con relieve, sombras, oclusión ambiental, brillo de las luces.
 * - `low`: solo color y luz básica, para móviles y equipos modestos.
 * Se detecta sola y el visitante puede cambiarla (se recuerda en este navegador).
 */
export type Quality = 'high' | 'low'

const KEY = 'vinylclub:quality'

interface NavigatorHints {
  deviceMemory?: number
  connection?: { saveData?: boolean }
}

export function detectQuality(): Quality {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'high' || saved === 'low') return saved
  } catch {
    // Sin almacenamiento: se decide por el dispositivo.
  }
  const nav = navigator as Navigator & NavigatorHints
  const touchSmall = window.matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 820
  const lowMemory = (nav.deviceMemory ?? 8) <= 4
  const fewCores = (nav.hardwareConcurrency ?? 8) <= 4
  const saveData = nav.connection?.saveData === true
  return touchSmall || lowMemory || fewCores || saveData ? 'low' : 'high'
}

export function saveQuality(quality: Quality) {
  try {
    localStorage.setItem(KEY, quality)
  } catch {
    // Sin almacenamiento: el cambio dura hasta recargar.
  }
}
