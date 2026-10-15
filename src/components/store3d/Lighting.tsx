/**
 * Luz «de verdad»: reflejos y luz ambiental de un interior real (HDRI de Poly Haven)
 * y, en calidad alta, posprocesado de cámara: oclusión ambiental (rincones y
 * contactos se oscurecen), brillo de bombillas y neones, viñeta y algo de grano.
 */
import { EffectComposer, Bloom, N8AO, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { useLoader, useThree } from '@react-three/fiber'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { useEffect } from 'react'
import * as THREE from 'three'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'
import type { Quality } from './quality'

const HDRI = `${import.meta.env.BASE_URL}hdri/brown_photostudio_02.hdr`

/** Ilumina y refleja con el HDRI, sin mostrarlo de fondo (el fondo es la propia tienda). */
export function InteriorEnvironment({ intensity = 0.45 }: { intensity?: number }) {
  const texture = useLoader(HDRLoader, HDRI)
  const scene = useThree((state) => state.scene)
  useEffect(() => {
    texture.mapping = THREE.EquirectangularReflectionMapping
    scene.environment = texture
    scene.environmentIntensity = intensity
    return () => {
      scene.environment = null
    }
  }, [texture, scene, intensity])
  return null
}

export function CameraEffects({ quality }: { quality: Quality }) {
  if (quality !== 'high') return null
  return (
    <EffectComposer multisampling={4}>
      <N8AO aoRadius={0.55} distanceFalloff={0.8} intensity={2.4} color="#1a0f08" halfRes quality="medium" />
      <Bloom mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={0.75} />
      <Vignette offset={0.32} darkness={0.55} />
      <Noise opacity={0.035} premultiply blendFunction={BlendFunction.SOFT_LIGHT} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
