/**
 * Atlas de portadas: una imagen por década con todas sus miniaturas, generada por
 * `scripts/build-cover-atlas.mjs` y servida desde la propia web (carga inmediata,
 * sin depender de Cover Art Archive dentro de la tienda 3D).
 */
import * as THREE from 'three'
import raw from '@/data/charts/coverAtlas.json'

interface AtlasFile {
  cell: number
  cols: number
  decades: Record<string, { file: string; rows: number; count: number }>
  covers: Record<string, [decade: string, index: number]>
}

// Los JSON se tipan como arrays genéricos: se convierte a la forma conocida del fichero generado.
const atlas = raw as unknown as AtlasFile

/** Margen en píxeles para que, al verse de lejos, no se mezclen portadas vecinas. */
const INSET_PX = 2

export const atlasDecades = () => Object.keys(atlas.decades)

export const atlasUrl = (decade: string) => {
  const entry = atlas.decades[decade]
  return entry ? `${import.meta.env.BASE_URL}${entry.file}` : undefined
}

/**
 * Coordenadas de textura de la portada de un disco dentro del atlas de su década:
 * [u0, v0, u1, v1], o `null` si el disco no tiene portada.
 */
export function atlasUV(albumId: string): [number, number, number, number] | null {
  const position = atlas.covers[albumId]
  if (!position) return null
  const [decade, index] = position
  const entry = atlas.decades[decade]
  if (!entry) return null
  const width = atlas.cols * atlas.cell
  const height = entry.rows * atlas.cell
  const col = index % atlas.cols
  const row = Math.floor(index / atlas.cols)
  const u0 = (col * atlas.cell + INSET_PX) / width
  const u1 = ((col + 1) * atlas.cell - INSET_PX) / width
  // La textura se invierte en vertical al subirla (flipY): la fila 0 está arriba (v = 1).
  const v1 = 1 - (row * atlas.cell + INSET_PX) / height
  const v0 = 1 - ((row + 1) * atlas.cell - INSET_PX) / height
  return [u0, v0, u1, v1]
}

/** Plano de portada con las coordenadas de textura apuntando a su hueco del atlas. */
export function coverGeometry(size: number, uv: [number, number, number, number]) {
  const geometry = new THREE.PlaneGeometry(size, size)
  const [u0, v0, u1, v1] = uv
  // Vértices de PlaneGeometry: arriba-izquierda, arriba-derecha, abajo-izquierda, abajo-derecha.
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute([u0, v1, u1, v1, u0, v0, u1, v0], 2))
  return geometry
}

const loader = new THREE.TextureLoader()

export function loadAtlas(decade: string): Promise<THREE.Texture | null> {
  const url = atlasUrl(decade)
  if (!url) return Promise.resolve(null)
  return new Promise((resolve) => {
    loader.load(
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
