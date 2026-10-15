/**
 * Calidad gráfica de la tienda 3D. La tienda siempre arranca en `medium`; se cambia en
 * la ventana Ajustes y el cambio dura lo que dure la visita.
 *
 * Todo lo que depende de la calidad está en `QUALITY`: la escena solo lee estos valores.
 */
export type Quality = 'low' | 'medium' | 'high'

export const DEFAULT_QUALITY: Quality = 'medium'

export interface QualityProfile {
  label: string
  description: string
  /** Texturas con relieve y brillo (normal y roughness), no solo color. */
  detailedSurfaces: boolean
  /** Sombras (se calculan una vez; algunas lámparas las proyectan). */
  shadows: boolean
  /** Posprocesado de cámara: oclusión ambiental, brillo de luces, viñeta y grano. */
  cameraEffects: boolean
  /** Resolución de render respecto a la pantalla [mínima, máxima]. */
  dpr: [number, number]
  /** Antialiasing del propio WebGL (con posprocesado lo hace el compositor). */
  antialias: boolean
  /** Intensidad de la luz ambiental del HDRI. */
  environment: number
}

export const QUALITY: Record<Quality, QualityProfile> = {
  low: {
    label: 'Ligera',
    description: 'Solo color y luz básica. La más fluida, para móviles y equipos modestos.',
    detailedSurfaces: false,
    shadows: false,
    cameraEffects: false,
    dpr: [1, 1],
    antialias: true,
    environment: 0.6,
  },
  medium: {
    label: 'Media',
    description: 'Madera y suelo con relieve y sombras, sin efectos de cámara. Equilibrio entre aspecto y fluidez.',
    detailedSurfaces: true,
    shadows: true,
    cameraEffects: false,
    dpr: [1, 1.25],
    antialias: true,
    environment: 0.55,
  },
  high: {
    label: 'Alta',
    description: 'Todo lo anterior y además oclusión ambiental, brillo de las luces, viñeta y grano. Para equipos potentes.',
    detailedSurfaces: true,
    shadows: true,
    cameraEffects: true,
    dpr: [1, 1.5],
    antialias: false,
    environment: 0.45,
  },
}

export const QUALITY_ORDER: Quality[] = ['low', 'medium', 'high']
