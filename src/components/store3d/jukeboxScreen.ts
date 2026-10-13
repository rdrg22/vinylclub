/**
 * Pantalla pixel-art de la gramola: un monitor CRT de baja resolución (160×120)
 * que se amplía sin suavizado para que se vean los píxeles, con líneas de barrido.
 * Colores de la tienda: madera oscura, crema, rojo señal y latón.
 */
import * as THREE from 'three'

export const SCREEN_W = 160
export const SCREEN_H = 120

const C = {
  bg: '#1b130c',
  panel: '#2b1c11',
  cream: '#f3e4c3',
  brass: '#e8c98f',
  red: '#d8402a',
  amber: '#f2b01e',
  dim: '#6b5640',
}

const FONT = '8px "Press Start 2P", monospace'

export type ScreenStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'unavailable'

export interface ScreenState {
  status: ScreenStatus
  title?: string
  artist?: string
  /** Progreso real de la demo (0–1) y segundos transcurridos / totales. */
  progress?: number
  current?: number
  duration?: number
  /** Títulos para el modo selector (en reposo). */
  titles: string[]
}

const time = (seconds = 0) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

/** Mayúsculas sin acentos: la fuente pixel solo trae ASCII. */
const ascii = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\x20-\x7e]/g, '?')
    .toUpperCase()

/** Triángulo de «play» hecho con bloques de píxeles. */
function playIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.fillStyle = color
  for (let i = 0; i < size; i++) {
    const h = size * 2 - i * 2
    ctx.fillRect(x + i, y + i, 1, Math.max(1, h))
  }
}

/** Corchea pixelada. */
function noteIcon(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(x + 4, y, 1, 7)
  ctx.fillRect(x + 5, y, 3, 1)
  ctx.fillRect(x + 7, y + 1, 1, 2)
  ctx.fillRect(x + 1, y + 6, 4, 3)
}

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, color: string, align: CanvasTextAlign = 'left') {
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.fillText(value, x, y)
}

/** Recorta a un ancho en caracteres (la fuente es monoespaciada de 8 px). */
const fit = (value: string, chars: number) => (value.length > chars ? `${value.slice(0, chars - 1)}.` : value)

/** Texto en marquesina: se desplaza si no cabe. */
function marquee(ctx: CanvasRenderingContext2D, value: string, y: number, color: string, t: number) {
  const chars = 18
  if (value.length <= chars) return text(ctx, value, SCREEN_W / 2, y, color, 'center')
  const padded = `${value}   *   `
  const offset = Math.floor(t * 6) % padded.length
  text(ctx, (padded + padded).slice(offset, offset + chars), 8, y, color)
}

/** Ecualizador pixelado: barras de bloques de 2 px que suben y bajan. */
function equalizer(ctx: CanvasRenderingContext2D, t: number, active: boolean) {
  const bars = 18
  const baseY = 96
  for (let i = 0; i < bars; i++) {
    const wave = active
      ? 0.45 + 0.3 * Math.sin(t * 7 + i * 0.9) + 0.25 * Math.sin(t * 13.3 + i * 2.1)
      : 0.08
    const blocks = Math.max(1, Math.round(wave * 12))
    for (let b = 0; b < blocks; b++) {
      ctx.fillStyle = b > 9 ? C.red : b > 6 ? C.amber : C.brass
      ctx.fillRect(8 + i * 8, baseY - b * 3, 6, 2)
    }
  }
}

function scanlines(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(0,0,0,0.28)'
  for (let y = 1; y < SCREEN_H; y += 2) ctx.fillRect(0, y, SCREEN_W, 1)
}

export function drawScreen(ctx: CanvasRenderingContext2D, state: ScreenState, t: number) {
  ctx.imageSmoothingEnabled = false
  ctx.font = FONT
  ctx.textBaseline = 'top'
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)

  // Cabecera de latón.
  ctx.fillStyle = C.brass
  ctx.fillRect(0, 0, SCREEN_W, 13)
  text(ctx, 'GRAMOLA', 6, 3, C.bg)
  noteIcon(ctx, SCREEN_W - 14, 2, C.bg)

  const blink = Math.floor(t * 2) % 2 === 0

  if (state.status === 'playing' || state.status === 'paused') {
    const playing = state.status === 'playing'
    text(ctx, playing ? 'AHORA SUENA' : 'EN PAUSA', SCREEN_W / 2, 20, playing ? C.red : C.dim, 'center')
    marquee(ctx, ascii(state.title ?? ''), 34, C.cream, t)
    text(ctx, fit(ascii(state.artist ?? ''), 18), SCREEN_W / 2, 46, C.brass, 'center')
    equalizer(ctx, t, playing)
    // Barra de progreso real de la demo.
    const progress = Math.min(1, Math.max(0, state.progress ?? 0))
    ctx.fillStyle = C.panel
    ctx.fillRect(8, 103, SCREEN_W - 16, 5)
    ctx.fillStyle = C.red
    ctx.fillRect(8, 103, Math.round((SCREEN_W - 16) * progress), 5)
    ctx.fillStyle = C.cream
    ctx.fillRect(8 + Math.round((SCREEN_W - 17) * progress), 102, 1, 7)
    text(ctx, time(state.current), 8, 111, C.dim)
    text(ctx, time(state.duration ?? 30), SCREEN_W - 8, 111, C.dim, 'right')
  } else if (state.status === 'loading') {
    text(ctx, 'BUSCANDO', SCREEN_W / 2, 44, C.cream, 'center')
    text(ctx, `DISCO${'.'.repeat(Math.floor(t * 3) % 4)}`.padEnd(8, ' '), SCREEN_W / 2 - 28, 58, C.brass)
    equalizer(ctx, t, false)
  } else if (state.status === 'unavailable') {
    text(ctx, 'SIN DEMO', SCREEN_W / 2, 40, C.red, 'center')
    text(ctx, 'PULSA OTRA', SCREEN_W / 2, 58, C.cream, 'center')
    text(ctx, 'VEZ', SCREEN_W / 2, 70, C.cream, 'center')
  } else {
    // Reposo: selector con títulos reales y botón ▶ que parpadea.
    playIcon(ctx, 12, 22, 7, blink ? C.red : C.dim)
    text(ctx, 'PULSA PARA', 28, 22, C.cream)
    text(ctx, 'SONAR', 28, 32, C.cream)
    const titles = state.titles.length ? state.titles : ['...']
    const start = Math.floor(t / 2.5) % titles.length
    for (let row = 0; row < 4; row++) {
      const index = (start + row) % titles.length
      const y = 50 + row * 13
      ctx.fillStyle = row === 0 ? C.red : C.panel
      ctx.fillRect(6, y - 2, 20, 11)
      text(ctx, `${String.fromCharCode(65 + (index % 4))}${Math.floor(index / 4) + 1}`, 8, y, row === 0 ? C.cream : C.brass)
      text(ctx, fit(ascii(titles[index] ?? ''), 15), 30, y, row === 0 ? C.cream : C.dim)
    }
  }

  scanlines(ctx)
}

/** Canvas + textura sin suavizado (píxeles nítidos al ampliarse). */
export function createScreenTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = SCREEN_W
  canvas.height = SCREEN_H
  const ctx = canvas.getContext('2d')
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  return { texture, ctx }
}

/** Letrero pixelado para el arco superior de la gramola. */
export function marqueeSignTexture() {
  const { texture, ctx } = createScreenTexture()
  if (ctx) {
    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = C.bg
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)
    ctx.font = FONT
    ctx.textBaseline = 'top'
    ctx.textAlign = 'center'
    // El arco es medio círculo: solo se ve la mitad superior del lienzo.
    ctx.fillStyle = C.amber
    ctx.fillText('VINYL', SCREEN_W / 2, 26)
    ctx.fillStyle = C.cream
    ctx.fillText('CLUB', SCREEN_W / 2, 38)
    ctx.fillStyle = C.red
    for (let i = 0; i < 9; i++) ctx.fillRect(SCREEN_W / 2 - 36 + i * 9, 51, 4, 4)
    scanlines(ctx)
    texture.needsUpdate = true
  }
  return texture
}
