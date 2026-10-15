/**
 * Marcas translúcidas en el suelo de la tienda: se pulsan para ir a ese sitio. Laten
 * suavemente para invitar a pulsarlas y se iluminan al pasar el ratón. La del sitio en
 * el que se está no se muestra.
 */
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { FloorSpot } from './spots'
import { floorArrowTexture, floorSpotTexture } from './textures'

const PLATE = { width: 1.3, depth: 0.65 }
const ARROW = 0.36
const FLOOR_Y = 0.012

interface Props {
  spots: FloorSpot[]
  /** Sitio en el que se está (su marca se oculta). */
  currentId: string | null
  /** Con un disco en la mano o una ventana abierta no se camina. */
  disabled: boolean
  reducedMotion: boolean
  onGo: (spot: FloorSpot) => void
  onHint: (hint: string | null) => void
}

export function FloorSpots({ spots, currentId, disabled, reducedMotion, onGo, onHint }: Props) {
  const arrow = useMemo(() => floorArrowTexture(), [])
  return (
    <group visible={!disabled}>
      {spots.map((spot, i) =>
        spot.id === currentId ? null : (
          <Spot key={spot.id} spot={spot} arrow={arrow} phase={i * 0.7} disabled={disabled} reducedMotion={reducedMotion} onGo={onGo} onHint={onHint} />
        ),
      )}
    </group>
  )
}

interface SpotProps extends Pick<Props, 'disabled' | 'reducedMotion' | 'onGo' | 'onHint'> {
  spot: FloorSpot
  arrow: THREE.Texture
  phase: number
}

function Spot({ spot, arrow, phase, disabled, reducedMotion, onGo, onHint }: SpotProps) {
  const [hovered, setHovered] = useState(false)
  const plate = useMemo(() => floorSpotTexture(spot.label), [spot.label])
  const plateMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const arrowMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const plateMesh = useRef<THREE.Mesh>(null)

  // Latido suave: la marca «respira» para que se vea que se puede pulsar.
  useFrame(({ clock, camera }) => {
    // El nombre se lee siempre desde donde se está: la plancha gira hacia la cámara.
    if (plateMesh.current) {
      const yaw = Math.atan2(-(spot.x - camera.position.x), -(spot.z - camera.position.z))
      plateMesh.current.rotation.z = yaw
    }
    const breath = reducedMotion ? 0.85 : 0.82 + Math.sin(clock.elapsedTime * 2 + phase) * 0.12
    const opacity = hovered ? 1 : breath
    if (plateMaterial.current) plateMaterial.current.opacity = opacity
    if (arrowMaterial.current) arrowMaterial.current.opacity = opacity * 0.9
  })

  const events = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      if (disabled) return
      e.stopPropagation()
      setHovered(true)
      onHint(`Ir a: ${spot.label}`)
      document.body.style.cursor = 'pointer'
    },
    onPointerOut: () => {
      setHovered(false)
      onHint(null)
      document.body.style.cursor = ''
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (disabled) return
      e.stopPropagation()
      // Un arrastre para mirar alrededor no cuenta como clic.
      if (e.delta > 6) return
      setHovered(false)
      onHint(null)
      document.body.style.cursor = ''
      onGo(spot)
    },
  }

  // La flecha va delante de la marca, hacia donde se mirará al llegar, fuera del círculo
  // que barre la plancha al girar hacia la cámara.
  const reach = Math.hypot(PLATE.width, PLATE.depth) / 2 + ARROW * 0.6
  const ax = -Math.sin(spot.facing) * reach
  const az = -Math.cos(spot.facing) * reach
  const scale = hovered ? 1.07 : 1

  return (
    <group position={[spot.x, FLOOR_Y, spot.z]} scale={scale}>
      <mesh ref={plateMesh} rotation-x={-Math.PI / 2} renderOrder={2} {...events}>
        <planeGeometry args={[PLATE.width, PLATE.depth]} />
        <meshBasicMaterial ref={plateMaterial} map={plate} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[ax, 0.001, az]} rotation={[-Math.PI / 2, 0, spot.facing]} renderOrder={2} {...events}>
        <planeGeometry args={[ARROW, ARROW]} />
        <meshBasicMaterial ref={arrowMaterial} map={arrow} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}
