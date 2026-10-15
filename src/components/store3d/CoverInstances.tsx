/**
 * Todas las portadas de un mueble en una sola llamada de dibujo (InstancedMesh).
 * Cada instancia lleva su recorte del atlas en un atributo propio y el shader lo
 * aplica, así que 90 portadas cuestan lo mismo que una. Se puede pasar el ratón,
 * pulsar y ocultar (disco en la mano) igual que con mallas sueltas.
 */
import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { Album } from '@/types/music'
import { atlasUV } from './atlas'
import { COVER_SIZE, type CoverSlot } from './layout'

interface CoverInstancesProps {
  slots: CoverSlot[]
  atlas: THREE.Texture
  takenIds: string[]
  onHover: (album: Album | null) => void
  onSelect: (album: Album, object: THREE.Object3D) => void
}

/** Material de portada que lee el recorte del atlas de cada instancia. */
function atlasInstanceMaterial(atlas: THREE.Texture) {
  const material = new THREE.MeshStandardMaterial({ map: atlas, roughness: 0.38, envMapIntensity: 0.8 })
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 atlasRect;')
      .replace(
        '#include <uv_vertex>',
        '#include <uv_vertex>\n#ifdef USE_MAP\n  vMapUv = mix(atlasRect.xy, atlasRect.zw, uv);\n#endif',
      )
  }
  // Mismo programa para todos los muebles (no se recompila por cada uno).
  material.customProgramCacheKey = () => 'vinyl-atlas-instanced'
  return material
}

const LEAN = -0.1 // inclinación de las fundas apoyadas en la trasera
const dummy = new THREE.Object3D()

export function CoverInstances({ slots, atlas, takenIds, onHover, onSelect }: CoverInstancesProps) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const [hovered, setHovered] = useState<number | null>(null)

  const entries = useMemo(
    () => slots.flatMap((slot) => {
      const uv = atlasUV(slot.album.id)
      return uv ? [{ slot, uv }] : []
    }),
    [slots],
  )

  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(COVER_SIZE, COVER_SIZE)
    const rects = new Float32Array(entries.length * 4)
    entries.forEach((entry, i) => rects.set(entry.uv, i * 4))
    plane.setAttribute('atlasRect', new THREE.InstancedBufferAttribute(rects, 4))
    return plane
  }, [entries])
  const material = useMemo(() => atlasInstanceMaterial(atlas), [atlas])
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  // Posición de cada funda: apoyada, levantada al pasar el ratón u oculta si está en la mano.
  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    entries.forEach(({ slot }, i) => {
      const lifted = i === hovered
      const taken = takenIds.includes(slot.album.id)
      dummy.position.set(slot.x, slot.y + (lifted ? 0.04 : 0), lifted ? 0.2 : 0.12)
      dummy.rotation.set(lifted ? 0 : LEAN, 0, 0)
      dummy.scale.setScalar(taken ? 0 : lifted ? 1.08 : 1)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
    m.computeBoundingSphere()
  }, [entries, hovered, takenIds])

  const albumAt = (e: ThreeEvent<PointerEvent | MouseEvent>) =>
    e.instanceId === undefined ? undefined : entries[e.instanceId]

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, entries.length]}
      castShadow
      receiveShadow
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        const entry = albumAt(e)
        if (!entry || e.instanceId === hovered) return
        setHovered(e.instanceId ?? null)
        onHover(entry.slot.album)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(null)
        onHover(null)
        document.body.style.cursor = ''
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        const entry = albumAt(e)
        // Un arrastre para mirar alrededor no cuenta como clic.
        if (!entry || e.delta > 6 || takenIds.includes(entry.slot.album.id) || !mesh.current) return
        setHovered(null)
        onHover(null)
        document.body.style.cursor = ''
        // Pose real de esa funda en el mundo, para que el disco salga de su hueco exacto.
        const instanceMatrix = new THREE.Matrix4()
        mesh.current.getMatrixAt(e.instanceId!, instanceMatrix)
        const pose = new THREE.Object3D()
        pose.applyMatrix4(instanceMatrix.premultiply(mesh.current.matrixWorld))
        pose.updateMatrixWorld()
        onSelect(entry.slot.album, pose)
      }}
    />
  )
}
