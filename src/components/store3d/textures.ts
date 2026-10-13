/**
 * Texturas de la tienda 3D dibujadas en un <canvas>: carteles, etiquetas, suelo y
 * fundas de los discos sin portada. Las portadas reales vienen de los atlas (atlas.ts).
 */
import * as THREE from 'three'
import type { Album } from '@/types/music'
import { hashString } from '@/utils/hash'

const SLEEVES = [
  { bg: '#1f1d1a', fg: '#efe8da' },
  { bg: '#cdbf9f', fg: '#1f1d1a' },
  { bg: '#7d3426', fg: '#f3e9d8' },
  { bg: '#344236', fg: '#ede4d0' },
  { bg: '#e2d9c5', fg: '#7d3426' },
  { bg: '#24303f', fg: '#e9e1cf' },
] as const

export const sleeveFor = (album: Pick<Album, 'id' | 'title'>) => SLEEVES[hashString(album.id + album.title) % SLEEVES.length] ?? SLEEVES[0]

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (ctx) draw(ctx)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) {
    lines.length = maxLines
    lines[maxLines - 1] = `${lines[maxLines - 1]}…`
  }
  return lines
}

// ---------------------------------------------------------------- fundas sin portada

const placeholderCache = new Map<string, THREE.Texture>()

/** Funda tipográfica para discos sin portada, como en la vista 2D. */
export function placeholderTexture(album: Album): THREE.Texture {
  const cached = placeholderCache.get(album.id)
  if (cached) return cached
  const { bg, fg } = sleeveFor(album)
  const texture = canvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 256, 256)
    ctx.strokeStyle = fg
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.arc(180, 80, 42, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.fillStyle = fg
    ctx.font = '500 13px "IBM Plex Mono", monospace'
    ctx.fillText(album.artist.toUpperCase().slice(0, 28), 20, 34)
    ctx.font = '500 30px Fraunces, Georgia, serif'
    const lines = wrapLines(ctx, album.title, 216, 3)
    lines.forEach((line, i) => ctx.fillText(line, 20, 236 - (lines.length - 1 - i) * 32))
  })
  placeholderCache.set(album.id, texture)
  return texture
}

// ---------------------------------------------------------------- tienda

/** Cartel de madera pintado a mano para cada década. */
export function signTexture(label: string, sub: string) {
  return canvasTexture(1024, 256, (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 0, 256)
    grad.addColorStop(0, '#5a3b22')
    grad.addColorStop(1, '#3e2716')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 1024, 256)
    // Vetas de la madera.
    ctx.globalAlpha = 0.12
    ctx.strokeStyle = '#000'
    for (let y = 12; y < 256; y += 9 + ((y * 7) % 11)) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.bezierCurveTo(300, y + 6, 700, y - 6, 1024, y + 3)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    ctx.strokeStyle = '#e8c98f'
    ctx.lineWidth = 6
    ctx.strokeRect(18, 18, 988, 220)
    ctx.fillStyle = '#f3e4c3'
    ctx.textAlign = 'center'
    ctx.font = 'italic 600 112px Fraunces, Georgia, serif'
    ctx.fillText(label, 512, 142)
    ctx.font = '500 26px "IBM Plex Mono", monospace'
    ctx.fillStyle = '#e8c98f'
    ctx.fillText(sub.toUpperCase(), 512, 200)
  })
}

/** Etiqueta de precio con el año, pegada al canto de la balda. */
export function yearTagTexture(year: number) {
  return canvasTexture(128, 48, (ctx) => {
    ctx.fillStyle = '#f6efdc'
    ctx.fillRect(0, 0, 128, 48)
    ctx.fillStyle = '#d8402a'
    ctx.fillRect(0, 0, 10, 48)
    ctx.fillStyle = '#1f1d1a'
    ctx.font = '600 30px "IBM Plex Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillText(String(year), 70, 35)
  })
}

/** Rótulo principal al fondo de la tienda. */
export function storeSignTexture() {
  return canvasTexture(1024, 384, (ctx) => {
    ctx.fillStyle = '#2b1a0e'
    ctx.fillRect(0, 0, 1024, 384)
    ctx.fillStyle = '#f3e4c3'
    ctx.textAlign = 'center'
    ctx.font = 'italic 700 150px Fraunces, Georgia, serif'
    ctx.fillText('Vinyl Club', 512, 200)
    ctx.font = '500 30px "IBM Plex Mono", monospace'
    ctx.fillStyle = '#e8c98f'
    ctx.fillText('LOS MÁS VENDIDOS DESDE 1956', 512, 280)
    ctx.fillStyle = '#d8402a'
    ctx.beginPath()
    ctx.arc(512, 335, 10, 0, Math.PI * 2)
    ctx.fill()
  })
}

/** Tarima de madera: tablas con tonos ligeramente distintos. */
export function floorTexture() {
  const texture = canvasTexture(512, 512, (ctx) => {
    const tones = ['#8a5a34', '#7e5230', '#93623a', '#845632', '#7a4f2d']
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = tones[i % tones.length]!
      ctx.fillRect(i * 64, 0, 64, 512)
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.fillRect(i * 64, 0, 2, 512)
      ctx.fillRect(i * 64, ((i * 157) % 512) | 0, 64, 2)
    }
  })
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  return texture
}

/** Las texturas de canvas usan las fuentes de la web: esperamos a que estén cargadas. */
export async function fontsReady() {
  try {
    await Promise.all([
      document.fonts.load('italic 600 112px Fraunces'),
      document.fonts.load('500 26px "IBM Plex Mono"'),
      document.fonts.load('500 30px Fraunces'),
    ])
  } catch {
    // Si fallan, se dibuja con la fuente de reserva.
  }
}
