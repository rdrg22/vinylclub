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

// ---------------------------------------------------------------- disco en la mano

/** Portada inmediata recortada del atlas (misma imagen, sin esperar a la de alta resolución). */
export function frontFromAtlas(atlas: THREE.Texture, uv: [number, number, number, number]): THREE.Texture | null {
  const image = atlas.image as CanvasImageSource & { width: number; height: number }
  if (!image?.width) return null
  const [u0, v0, u1, v1] = uv
  return canvasTexture(256, 256, (ctx) => {
    ctx.drawImage(image, u0 * image.width, (1 - v1) * image.height, (u1 - u0) * image.width, (v1 - v0) * image.height, 0, 0, 256, 256)
  })
}

const loaderHiRes = new THREE.TextureLoader()
loaderHiRes.setCrossOrigin('anonymous')

/** Imagen remota como textura (portada grande o contraportada real); `null` si no carga. */
export function loadRemoteTexture(url: string): Promise<THREE.Texture | null> {
  return new Promise((resolve) => {
    loaderHiRes.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        texture.anisotropy = 8
        resolve(texture)
      },
      undefined,
      () => resolve(null),
    )
  })
}

export interface BackData {
  tracks: Array<{ number: string; title: string; length?: string }>
  footer: string[]
  note: string
}

/** Contraportada compuesta con datos reales: título, lista de canciones y datos de la edición. */
export function composedBackTexture(album: Album, data: BackData | null) {
  return canvasTexture(1024, 1024, (ctx) => {
    ctx.fillStyle = '#efe6d2'
    ctx.fillRect(0, 0, 1024, 1024)
    // Papel ligeramente envejecido en los bordes.
    const vignette = ctx.createRadialGradient(512, 512, 380, 512, 512, 760)
    vignette.addColorStop(0, 'rgba(0,0,0,0)')
    vignette.addColorStop(1, 'rgba(90,60,30,0.22)')
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, 1024, 1024)

    ctx.fillStyle = '#1f1d1a'
    ctx.font = '500 26px "IBM Plex Mono", monospace'
    ctx.fillText(album.artist.toUpperCase().slice(0, 48), 64, 96)
    ctx.font = 'italic 600 58px Fraunces, Georgia, serif'
    wrapLines(ctx, album.title, 896, 2).forEach((line, i) => ctx.fillText(line, 64, 168 + i * 62))
    ctx.fillStyle = '#d8402a'
    ctx.fillRect(64, 252, 120, 6)

    const tracks = data?.tracks ?? []
    if (!data) {
      ctx.fillStyle = '#6b6258'
      ctx.font = '500 24px "IBM Plex Mono", monospace'
      ctx.fillText('CARGANDO LA LISTA DE CANCIONES…', 64, 330)
    } else if (tracks.length === 0) {
      ctx.fillStyle = '#6b6258'
      ctx.font = '500 24px "IBM Plex Mono", monospace'
      ctx.fillText('SIN LISTA DE CANCIONES EN MUSICBRAINZ', 64, 330)
    } else {
      const perColumn = Math.ceil(tracks.length / 2)
      const lineHeight = Math.min(44, Math.floor(560 / perColumn))
      const size = Math.max(16, Math.min(26, lineHeight - 12))
      tracks.forEach((track, i) => {
        const column = i < perColumn ? 0 : 1
        const x = 64 + column * 464
        const y = 330 + (i % perColumn) * lineHeight
        ctx.fillStyle = '#8a8378'
        ctx.font = `500 ${size}px "IBM Plex Mono", monospace`
        ctx.fillText(track.number.padStart(2, ' '), x, y)
        ctx.fillStyle = '#1f1d1a'
        ctx.font = `500 ${size + 2}px "Inter Tight", system-ui, sans-serif`
        const title = wrapLines(ctx, track.title, 300, 1)[0] ?? ''
        ctx.fillText(title, x + size * 2.4, y)
        ctx.fillStyle = '#8a8378'
        ctx.font = `500 ${size}px "IBM Plex Mono", monospace`
        ctx.textAlign = 'right'
        ctx.fillText(track.length ?? '', x + 420, y)
        ctx.textAlign = 'left'
      })
    }

    ctx.fillStyle = '#1f1d1a'
    ctx.fillRect(64, 900, 896, 2)
    ctx.font = '500 20px "IBM Plex Mono", monospace'
    ;(data?.footer ?? []).slice(0, 2).forEach((line, i) => ctx.fillText(line.toUpperCase().slice(0, 70), 64, 936 + i * 28))
    if (data?.note) {
      ctx.fillStyle = '#8a8378'
      ctx.font = '500 16px "IBM Plex Mono", monospace'
      ctx.textAlign = 'right'
      ctx.fillText(data.note.toUpperCase(), 960, 994)
      ctx.textAlign = 'left'
    }
  })
}

/** Galleta del vinilo: color de la funda, título y agujero central. */
export function discLabelTexture(album: Album) {
  const { bg, fg } = sleeveFor(album)
  return canvasTexture(512, 512, (ctx) => {
    // Surcos.
    ctx.fillStyle = '#141210'
    ctx.fillRect(0, 0, 512, 512)
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    for (let r = 120; r < 254; r += 4) {
      ctx.beginPath()
      ctx.arc(256, 256, r, 0, Math.PI * 2)
      ctx.stroke()
    }
    // Brillo que delata el giro.
    ctx.fillStyle = 'rgba(255,255,255,0.07)'
    ctx.beginPath()
    ctx.moveTo(256, 256)
    ctx.arc(256, 256, 254, -0.5, -0.1)
    ctx.fill()
    ctx.fillStyle = bg
    ctx.beginPath()
    ctx.arc(256, 256, 96, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = fg
    ctx.textAlign = 'center'
    ctx.font = '600 22px Fraunces, Georgia, serif'
    ctx.fillText(wrapLines(ctx, album.title, 150, 1)[0] ?? '', 256, 222)
    ctx.font = '500 13px "IBM Plex Mono", monospace'
    ctx.fillText(album.artist.toUpperCase().slice(0, 22), 256, 306)
    ctx.fillStyle = '#efe6d2'
    ctx.beginPath()
    ctx.arc(256, 256, 7, 0, Math.PI * 2)
    ctx.fill()
  })
}

// ---------------------------------------------------------------- decoración

/** Dibuja en un canvas la portada de un disco recortada del atlas de su década. */
function drawAtlasCover(
  ctx: CanvasRenderingContext2D,
  atlas: THREE.Texture | null,
  uv: [number, number, number, number] | null,
  dx: number,
  dy: number,
  size: number,
) {
  const image = atlas?.image as (CanvasImageSource & { width: number; height: number }) | undefined
  if (!image?.width || !uv) {
    ctx.fillStyle = '#3e2716'
    ctx.fillRect(dx, dy, size, size)
    return
  }
  const [u0, v0, u1, v1] = uv
  ctx.drawImage(image, u0 * image.width, (1 - v1) * image.height, (u1 - u0) * image.width, (v1 - v0) * image.height, dx, dy, size, size)
}

/** Póster enmarcado con el nº 1 más duradero de una década. */
export function posterTexture(
  album: Album,
  year: number,
  decadeLabel: string,
  atlas: THREE.Texture | null,
  uv: [number, number, number, number] | null,
) {
  return canvasTexture(512, 768, (ctx) => {
    ctx.fillStyle = '#efe6d2'
    ctx.fillRect(0, 0, 512, 768)
    ctx.fillStyle = '#d8402a'
    ctx.font = '600 26px "IBM Plex Mono", monospace'
    ctx.fillText(decadeLabel.toUpperCase(), 40, 62)
    drawAtlasCover(ctx, atlas, uv, 40, 88, 432)
    ctx.fillStyle = '#1f1d1a'
    ctx.font = 'italic 700 64px Fraunces, Georgia, serif'
    ctx.fillText(`Nº 1 en ${year}`, 40, 600)
    ctx.font = '600 30px "Inter Tight", system-ui, sans-serif'
    ctx.fillText(wrapLines(ctx, album.title, 432, 1)[0] ?? '', 40, 652)
    ctx.fillStyle = '#6b6258'
    ctx.font = '500 22px "IBM Plex Mono", monospace'
    ctx.fillText(album.artist.toUpperCase().slice(0, 34), 40, 692)
    ctx.font = '500 16px "IBM Plex Mono", monospace'
    ctx.fillText('LISTA ANUAL DE BILLBOARD', 40, 736)
  })
}

/** Rótulo de neón con resplandor (fondo transparente). */
export function neonTexture(text: string, color: string) {
  return canvasTexture(1024, 256, (ctx) => {
    ctx.clearRect(0, 0, 1024, 256)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = 'italic 600 150px Fraunces, Georgia, serif'
    ctx.shadowColor = color
    for (const blur of [60, 30, 12]) {
      ctx.shadowBlur = blur
      ctx.fillStyle = color
      ctx.fillText(text, 512, 132)
    }
    ctx.shadowBlur = 0
    ctx.fillStyle = '#fff4f0'
    ctx.fillText(text, 512, 132)
  })
}

/** Panel frontal de la gramola: lista de selección con números 1 reales. */
export function jukeboxPanelTexture(titles: string[]) {
  return canvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = '#f6efdc'
    ctx.fillRect(0, 0, 512, 512)
    ctx.fillStyle = '#d8402a'
    ctx.font = 'italic 700 46px Fraunces, Georgia, serif'
    ctx.textAlign = 'center'
    ctx.fillText('Gramola', 256, 64)
    ctx.font = '600 18px "IBM Plex Mono", monospace'
    ctx.fillStyle = '#1f1d1a'
    ctx.fillText('PULSA PARA QUE SUENE UN Nº 1', 256, 100)
    ctx.textAlign = 'left'
    titles.slice(0, 8).forEach((title, i) => {
      const y = 150 + i * 44
      ctx.fillStyle = '#d8402a'
      ctx.fillRect(28, y - 22, 52, 30)
      ctx.fillStyle = '#f6efdc'
      ctx.font = '600 18px "IBM Plex Mono", monospace'
      ctx.fillText(`${String.fromCharCode(65 + (i % 4))}${Math.floor(i / 4) + 1}`, 38, y)
      ctx.fillStyle = '#1f1d1a'
      ctx.font = '500 22px "Inter Tight", system-ui, sans-serif'
      ctx.fillText(wrapLines(ctx, title, 390, 1)[0] ?? '', 96, y)
    })
  })
}

/** Etiqueta escrita a mano para cubetas y mostrador. */
export function labelCardTexture(text: string, sub?: string) {
  return canvasTexture(512, 160, (ctx) => {
    ctx.fillStyle = '#f6efdc'
    ctx.fillRect(0, 0, 512, 160)
    ctx.strokeStyle = '#d8402a'
    ctx.lineWidth = 6
    ctx.strokeRect(10, 10, 492, 140)
    ctx.fillStyle = '#1f1d1a'
    ctx.textAlign = 'center'
    ctx.font = 'italic 600 46px Fraunces, Georgia, serif'
    ctx.fillText(text, 256, sub ? 78 : 96)
    if (sub) {
      ctx.font = '500 20px "IBM Plex Mono", monospace'
      ctx.fillStyle = '#6b6258'
      ctx.fillText(sub.toUpperCase(), 256, 120)
    }
  })
}

/** Rejilla de altavoz. */
export function grilleTexture() {
  const texture = canvasTexture(128, 128, (ctx) => {
    ctx.fillStyle = '#1c1a18'
    ctx.fillRect(0, 0, 128, 128)
    ctx.fillStyle = '#2c2925'
    for (let y = 4; y < 128; y += 8) for (let x = 4; x < 128; x += 8) ctx.fillRect(x, y, 3, 3)
  })
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  return texture
}

/** Alfombra con forma de disco: surcos y galleta roja. */
export function rugTexture() {
  return canvasTexture(512, 512, (ctx) => {
    ctx.clearRect(0, 0, 512, 512)
    ctx.fillStyle = '#1a1714'
    ctx.beginPath()
    ctx.arc(256, 256, 254, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    for (let r = 110; r < 250; r += 6) {
      ctx.beginPath()
      ctx.arc(256, 256, r, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.fillStyle = '#d8402a'
    ctx.beginPath()
    ctx.arc(256, 256, 90, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#f3e4c3'
    ctx.textAlign = 'center'
    ctx.font = 'italic 600 34px Fraunces, Georgia, serif'
    ctx.fillText('Vinyl Club', 256, 250)
    ctx.font = '500 14px "IBM Plex Mono", monospace'
    ctx.fillText('33⅓ RPM', 256, 280)
    ctx.fillStyle = '#efe6d2'
    ctx.beginPath()
    ctx.arc(256, 256, 8, 0, Math.PI * 2)
    ctx.fill()
  })
}
