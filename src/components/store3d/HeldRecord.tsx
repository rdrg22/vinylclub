/**
 * El disco que el visitante ha sacado de la balda: viaja desde su hueco hasta
 * delante de la cámara, se gira arrastrando, se le da la vuelta para ver la
 * contraportada y, mientras suena su demo, el vinilo asoma de la funda y gira.
 */
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { coverUrlFor } from '@/services/coverArt'
import type { Album } from '@/types/music'
import { atlasUV } from './atlas'
import { COVER_SIZE } from './layout'
import {
  composedBackTexture,
  discLabelTexture,
  frontFromAtlas,
  loadRemoteTexture,
  placeholderTexture,
  type BackData,
} from './textures'

/** Estado compartido con la interfaz: lo escribe el arrastre y los botones, lo lee el bucle de render. */
export interface HoldControl {
  rotY: number
  rotX: number
  flipped: boolean
}

export interface HeldState {
  album: Album
  /** Pose del disco en la balda, en coordenadas del mundo. */
  fromPosition: THREE.Vector3
  fromQuaternion: THREE.Quaternion
}

interface HeldRecordProps {
  held: HeldState
  leaving: boolean
  control: HoldControl
  atlas: THREE.Texture | null
  back: BackData | null
  backImage?: string
  playing: boolean
  reducedMotion: boolean
  /** Fracción inferior de la pantalla tapada por la cartela: el disco se coloca en el hueco de arriba. */
  coveredBottom: number
  /** Si se indica, al soltarlo va aquí (el plato del tocadiscos) en vez de a su hueco. */
  toPose?: { position: THREE.Vector3; quaternion: THREE.Quaternion }
  onLeft: () => void
}

const THICKNESS = 0.008
const PICK_SECONDS = 0.65
const SIZE = COVER_SIZE * 1.02
const smooth = (t: number) => t * t * (3 - 2 * t)

export function HeldRecord({ held, leaving, control, atlas, back, backImage, playing, reducedMotion, coveredBottom, toPose, onLeft }: HeldRecordProps) {
  const group = useRef<THREE.Group>(null)
  const turn = useRef<THREE.Group>(null)
  const disc = useRef<THREE.Mesh>(null)
  const progress = useRef(reducedMotion ? 1 : 0)
  const view = useRef({ rotY: 0, rotX: 0, flip: 0, slide: 0 })
  const leftCalled = useRef(false)
  const { album } = held

  // ---------- texturas: portada inmediata del atlas, luego la grande
  const [front, setFront] = useState<THREE.Texture>(() => {
    const uv = atlasUV(album.id)
    return (atlas && uv && frontFromAtlas(atlas, uv)) || placeholderTexture(album)
  })
  useEffect(() => {
    const url = coverUrlFor(album, 500)
    if (!url) return
    let cancelled = false
    loadRemoteTexture(url).then((texture) => {
      if (texture && !cancelled) setFront(texture)
    })
    return () => {
      cancelled = true
    }
  }, [album])

  const composed = useMemo(() => composedBackTexture(album, back), [album, back])
  const [realBack, setRealBack] = useState<THREE.Texture | null>(null)
  useEffect(() => {
    if (!backImage) return
    let cancelled = false
    loadRemoteTexture(backImage).then((texture) => {
      if (!cancelled) setRealBack(texture)
    })
    return () => {
      cancelled = true
    }
  }, [backImage])
  const label = useMemo(() => discLabelTexture(album), [album])

  // Orden de caras de BoxGeometry: +x, −x, +y, −y, +z (portada), −z (contraportada).
  const materials = useMemo(() => {
    const edge = new THREE.MeshStandardMaterial({ color: '#d9cdb4', roughness: 0.9 })
    return [
      edge,
      edge,
      edge,
      edge,
      // Sin iluminación: el disco en la mano se lee siempre bien, como bajo la luz del mostrador.
      new THREE.MeshBasicMaterial({ map: front }),
      new THREE.MeshBasicMaterial({ map: realBack ?? composed }),
    ]
  }, [front, realBack, composed])
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials])

  // ---------- animación
  const target = useMemo(() => ({ position: new THREE.Vector3(), quaternion: new THREE.Quaternion() }), [])
  const forward = useMemo(() => new THREE.Vector3(), [])
  const up = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ camera, size }, delta) => {
    const g = group.current
    if (!g) return
    const dt = Math.min(delta, 0.05)
    const step = reducedMotion ? 1 : dt / PICK_SECONDS
    progress.current = THREE.MathUtils.clamp(progress.current + (leaving ? -step : step), 0, 1)

    // Delante de la cámara, centrado en el hueco que deja la cartela y a la distancia
    // justa para ocupar ~80 % de ese hueco (en alto y en ancho).
    const aspect = size.width / Math.max(1, size.height)
    const tanHalf = Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov / 2))
    const free = Math.max(0.3, 1 - coveredBottom)
    const fitHeight = SIZE / (0.8 * 2 * tanHalf * free)
    const fitWidth = SIZE / (0.8 * 2 * tanHalf * aspect)
    const distance = Math.max(0.42, fitHeight, fitWidth)
    camera.getWorldDirection(forward)
    // Centro del hueco en coordenadas de pantalla (NDC): y = fracción tapada.
    up.set(0, 1, 0).applyQuaternion(camera.quaternion).multiplyScalar(coveredBottom * distance * tanHalf)
    target.position.copy(camera.position).addScaledVector(forward, distance).add(up)
    target.quaternion.copy(camera.quaternion)

    const p = smooth(progress.current)
    const rest = leaving && toPose ? toPose : { position: held.fromPosition, quaternion: held.fromQuaternion }
    g.position.lerpVectors(rest.position, target.position, p)
    g.quaternion.slerpQuaternions(rest.quaternion, target.quaternion, p)

    // Giro del usuario y vuelta completa, suavizados.
    const v = view.current
    const k = reducedMotion ? 1 : Math.min(1, dt * 10)
    v.rotY += (control.rotY - v.rotY) * k
    v.rotX += (control.rotX - v.rotX) * k
    v.flip += ((control.flipped ? Math.PI : 0) - v.flip) * (reducedMotion ? 1 : Math.min(1, dt * 6))
    turn.current?.rotation.set(v.rotX, v.rotY + v.flip, 0)

    // El vinilo asoma por arriba y gira mientras suena la demo.
    v.slide += ((playing ? 0.16 : 0) - v.slide) * Math.min(1, dt * 4)
    if (disc.current) {
      disc.current.position.y = v.slide
      if (playing && !reducedMotion) disc.current.rotation.y += dt * 3.5
    }

    if (leaving && progress.current === 0 && !leftCalled.current) {
      leftCalled.current = true
      onLeft()
    }
  })

  return (
    <group ref={group}>
      <group ref={turn}>
        <mesh material={materials}>
          <boxGeometry args={[SIZE, SIZE, THICKNESS]} />
        </mesh>
        {/* El disco va dentro de la funda: solo se ve cuando asoma. */}
        <mesh ref={disc} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[SIZE * 0.47, SIZE * 0.47, 0.002, 64]} />
          <meshBasicMaterial attach="material-0" color="#141210" />
          <meshBasicMaterial attach="material-1" map={label} />
          <meshBasicMaterial attach="material-2" map={label} />
        </mesh>
      </group>
    </group>
  )
}
