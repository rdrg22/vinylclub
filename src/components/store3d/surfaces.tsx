/**
 * Materiales fotográficos (PBR) de la tienda: texturas de Poly Haven (CC0) en
 * public/textures, descargadas con scripts/fetch-polyhaven-assets.mjs.
 * En calidad alta se usan color, relieve (normal) y rugosidad; en baja, solo color.
 */
import { useLoader } from '@react-three/fiber'
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import * as THREE from 'three'
import { QUALITY, type Quality } from './quality'

export const SURFACES = ['wood_floor_worn', 'dark_wood', 'wood_table_worn', 'beige_wall_001', 'plastered_wall'] as const
export type SurfaceId = (typeof SURFACES)[number]

const MAPS = ['color', 'normal', 'rough'] as const
const url = (id: SurfaceId, map: (typeof MAPS)[number]) => `${import.meta.env.BASE_URL}textures/${id}/${map}.jpg`

export interface SurfaceOptions {
  /** Cuántas veces se repite la textura a lo ancho y a lo alto de la cara. */
  repeat?: [number, number]
  /** Tinte multiplicado sobre la foto (p. ej. para oscurecer una pared). */
  tint?: string
  roughness?: number
  /** Intensidad del relieve. */
  normalScale?: number
}

export type MakeSurface = (id: SurfaceId, options?: SurfaceOptions) => THREE.MeshStandardMaterial

const SurfacesContext = createContext<MakeSurface | null>(null)

export function useSurface(): MakeSurface {
  const make = useContext(SurfacesContext)
  if (!make) throw new Error('useSurface debe usarse dentro de <SurfacesProvider>')
  return make
}

/** Carga las texturas una vez (suspende hasta tenerlas) y ofrece materiales con la repetición pedida. */
export function SurfacesProvider({ quality, children }: { quality: Quality; children: ReactNode }) {
  const maps = QUALITY[quality].detailedSurfaces ? MAPS : (['color'] as const)
  const urls = useMemo(() => SURFACES.flatMap((id) => maps.map((map) => url(id, map))), [maps])
  const textures = useLoader(THREE.TextureLoader, urls)

  const make = useMemo<MakeSurface>(() => {
    const byUrl = new Map(urls.map((u, i) => [u, textures[i]!]))
    const cache = new Map<string, THREE.MeshStandardMaterial>()
    const prepare = (source: THREE.Texture | undefined, repeat: [number, number], color: boolean) => {
      if (!source) return null
      // Las copias comparten la imagen (y la textura en la GPU); solo cambia la repetición.
      const texture = source.clone()
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping
      texture.repeat.set(...repeat)
      texture.anisotropy = 8
      texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace
      texture.needsUpdate = true
      return texture
    }
    return (id, options = {}) => {
      const repeat = options.repeat ?? [1, 1]
      const key = JSON.stringify([id, options])
      const cached = cache.get(key)
      if (cached) return cached
      const normal = prepare(byUrl.get(url(id, 'normal')), repeat, false)
      const material = new THREE.MeshStandardMaterial({
        map: prepare(byUrl.get(url(id, 'color')), repeat, true),
        normalMap: normal,
        normalScale: new THREE.Vector2(options.normalScale ?? 1, options.normalScale ?? 1),
        roughnessMap: prepare(byUrl.get(url(id, 'rough')), repeat, false),
        roughness: options.roughness ?? 1,
        color: options.tint ?? '#ffffff',
      })
      cache.set(key, material)
      return material
    }
  }, [urls, textures])

  return <SurfacesContext.Provider value={make}>{children}</SurfacesContext.Provider>
}
