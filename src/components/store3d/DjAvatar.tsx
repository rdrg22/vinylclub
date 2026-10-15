/**
 * El DJ de la casa, detrás del mostrador. Figura genérica de geometría simple
 * (gorro, barba, sudadera y cascos), sin parecido con nadie real.
 *
 * - En reposo: manos apoyadas en el mostrador, respira y mira al visitante.
 * - Cuando suena el tocadiscos: una mano «rasca» el disco, la otra sujeta el
 *   auricular contra la oreja y cabecea al ritmo (~120 bpm), balanceándose.
 *
 * Los brazos se colocan con una cinemática inversa de dos huesos: se le da dónde
 * debe estar la mano y calcula hombro y codo. No proyecta sombra (las sombras de
 * la tienda son estáticas y una figura que se mueve las ensuciaría).
 */
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

interface DjProps {
  /** Posición de los pies (mira hacia +z, hacia la tienda). */
  position: [number, number, number]
  /** Posición del plato del tocadiscos, en coordenadas del mundo. */
  platter: [number, number, number]
  playing: boolean
  reducedMotion: boolean
  onHint: (hint: string | null) => void
}

const UPPER = 0.29 // brazo
const LOWER = 0.27 // antebrazo
const SHOULDER_Y = 1.42
const SHOULDER_X = 0.2
const BEAT = Math.PI * 4 // 120 bpm en radianes por segundo

const DOWN = new THREE.Vector3(0, -1, 0)

/**
 * Cinemática inversa de dos huesos. Devuelve la posición del codo dado el hombro,
 * el objetivo de la mano y un punto hacia el que debe apuntar el codo.
 */
function solveElbow(shoulder: THREE.Vector3, target: THREE.Vector3, pole: THREE.Vector3, out: THREE.Vector3) {
  const toTarget = target.clone().sub(shoulder)
  const d = THREE.MathUtils.clamp(toTarget.length(), Math.abs(UPPER - LOWER) + 1e-3, UPPER + LOWER - 1e-3)
  const dir = toTarget.normalize()
  // Distancia del hombro al pie de la perpendicular del codo, y altura del codo sobre esa línea.
  const a = (UPPER * UPPER - LOWER * LOWER + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(UPPER * UPPER - a * a, 0))
  const bend = pole.clone().sub(shoulder)
  bend.sub(dir.clone().multiplyScalar(bend.dot(dir))).normalize()
  return out.copy(shoulder).addScaledVector(dir, a).addScaledVector(bend, h)
}

interface ArmRefs {
  shoulder: React.RefObject<THREE.Group | null>
  elbow: React.RefObject<THREE.Group | null>
}

const tmpElbow = new THREE.Vector3()
const tmpDir = new THREE.Vector3()
const tmpQ = new THREE.Quaternion()

/** Orienta brazo y antebrazo para que la mano llegue a `target` (coordenadas del cuerpo). */
function poseArm(arm: ArmRefs, shoulderPos: THREE.Vector3, target: THREE.Vector3, pole: THREE.Vector3) {
  const s = arm.shoulder.current
  const e = arm.elbow.current
  if (!s || !e) return
  solveElbow(shoulderPos, target, pole, tmpElbow)
  s.position.copy(shoulderPos)
  s.quaternion.setFromUnitVectors(DOWN, tmpDir.copy(tmpElbow).sub(shoulderPos).normalize())
  // El antebrazo, en el espacio del brazo.
  tmpDir.copy(target).sub(tmpElbow).normalize().applyQuaternion(tmpQ.copy(s.quaternion).invert())
  e.quaternion.setFromUnitVectors(DOWN, tmpDir)
}

export function DjAvatar({ position, platter, playing, reducedMotion, onHint }: DjProps) {
  const body = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const left = { shoulder: useRef<THREE.Group>(null), elbow: useRef<THREE.Group>(null) }
  const right = { shoulder: useRef<THREE.Group>(null), elbow: useRef<THREE.Group>(null) }

  const materials = useMemo(
    () => ({
      skin: new THREE.MeshStandardMaterial({ color: '#b07a58', roughness: 0.65 }),
      hoodie: new THREE.MeshStandardMaterial({ color: '#2f5653', roughness: 0.9 }),
      cuff: new THREE.MeshStandardMaterial({ color: '#26403e', roughness: 0.9 }),
      beanie: new THREE.MeshStandardMaterial({ color: '#8f3527', roughness: 1 }),
      hair: new THREE.MeshStandardMaterial({ color: '#2a1b12', roughness: 0.95 }),
      pants: new THREE.MeshStandardMaterial({ color: '#1d2230', roughness: 0.85 }),
      phones: new THREE.MeshStandardMaterial({ color: '#141210', roughness: 0.4, metalness: 0.3 }),
      glasses: new THREE.MeshStandardMaterial({ color: '#0c0b0a', roughness: 0.15, metalness: 0.6 }),
    }),
    [],
  )

  // Estado animado: dónde está cada mano ahora (se acerca suavemente al objetivo).
  const anim = useMemo(
    () => ({
      leftHand: new THREE.Vector3(0.22, 1.05, 0.32),
      rightHand: new THREE.Vector3(-0.22, 1.05, 0.32),
      leftGoal: new THREE.Vector3(),
      rightGoal: new THREE.Vector3(),
      local: new THREE.Vector3(),
      camLocal: new THREE.Vector3(),
      leftInBody: new THREE.Vector3(),
      rightInBody: new THREE.Vector3(),
      bodyInverse: new THREE.Matrix4(),
    }),
    [],
  )
  const shoulders = useMemo(
    () => ({ left: new THREE.Vector3(SHOULDER_X, SHOULDER_Y, 0.02), right: new THREE.Vector3(-SHOULDER_X, SHOULDER_Y, 0.02) }),
    [],
  )
  const poles = useMemo(
    () => ({
      // Codos hacia fuera y atrás, como cuando se apoya uno en una mesa.
      left: new THREE.Vector3(0.9, 0.9, -0.6),
      right: new THREE.Vector3(-0.9, 0.9, -0.6),
      // Mano en la oreja: codo levantado hacia fuera.
      ear: new THREE.Vector3(-0.9, 1.4, 0.4),
    }),
    [],
  )

  useFrame(({ clock, camera }, dt) => {
    const t = clock.elapsedTime
    const moving = !reducedMotion
    const beat = playing && moving ? Math.sin(t * BEAT) : 0
    const k = 1 - Math.exp(-dt * 8) // suavizado independiente de los fps

    // Plato en coordenadas del cuerpo (el DJ no gira: basta con restar su posición).
    anim.local.set(platter[0] - position[0], platter[1] - position[1], platter[2] - position[2])

    if (playing) {
      // Mano izquierda sobre el borde del disco, adelante y atrás: el scratch.
      const scratch = moving ? Math.sin(t * BEAT * 0.5) * 0.06 : 0
      anim.leftGoal.set(anim.local.x - 0.04 + scratch * 0.4, anim.local.y + 0.03, anim.local.z - 0.1 + scratch)
      // Mano derecha sujetando el auricular contra la oreja.
      anim.rightGoal.set(-0.13, 1.66 + beat * 0.01, 0.02)
    } else {
      // Apoyado en el mostrador, con un leve vaivén de respiración.
      const breath = moving ? Math.sin(t * 1.6) * 0.008 : 0
      anim.leftGoal.set(0.24, 1.05 + breath, 0.3)
      anim.rightGoal.set(-0.24, 1.05 + breath, 0.3)
    }
    anim.leftHand.lerp(anim.leftGoal, k)
    anim.rightHand.lerp(anim.rightGoal, k)

    // Cuerpo: rebote y balanceo al ritmo; en reposo, respiración.
    if (body.current) {
      const bounce = playing && moving ? Math.abs(Math.sin(t * BEAT * 0.5)) * 0.025 : moving ? Math.sin(t * 1.6) * 0.004 : 0
      body.current.position.y = THREE.MathUtils.lerp(body.current.position.y, bounce, k)
      body.current.rotation.z = THREE.MathUtils.lerp(body.current.rotation.z, playing && moving ? Math.sin(t * BEAT * 0.25) * 0.05 : 0, k)
      body.current.rotation.x = THREE.MathUtils.lerp(body.current.rotation.x, playing ? 0.04 : 0.02, k)
    }

    // Cabeza: pinchando mira el plato y cabecea; en reposo sigue al visitante con la mirada.
    if (head.current) {
      let yaw = 0
      let pitch: number
      if (playing) {
        yaw = -0.15
        pitch = 0.35 + beat * 0.18
      } else {
        anim.camLocal.set(camera.position.x - position[0], camera.position.y - position[1] - 1.65, camera.position.z - position[2])
        yaw = THREE.MathUtils.clamp(Math.atan2(anim.camLocal.x, anim.camLocal.z), -0.7, 0.7)
        pitch = THREE.MathUtils.clamp(-Math.atan2(anim.camLocal.y, Math.hypot(anim.camLocal.x, anim.camLocal.z)), -0.3, 0.3)
      }
      head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, yaw, k * 0.6)
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, pitch, k)
    }

    // Los brazos cuelgan del torso, que se balancea: objetivos de las manos en su espacio.
    if (body.current) {
      body.current.updateMatrix()
      anim.bodyInverse.copy(body.current.matrix).invert()
    }
    anim.leftInBody.copy(anim.leftHand).applyMatrix4(anim.bodyInverse)
    anim.rightInBody.copy(anim.rightHand).applyMatrix4(anim.bodyInverse)
    poseArm(left, shoulders.left, anim.leftInBody, poles.left)
    poseArm(right, shoulders.right, anim.rightInBody, playing ? poles.ear : poles.right)
  })

  const hintHandlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      onHint(playing ? 'El DJ está pinchando tu disco' : 'El DJ de la casa: pon un disco en el plato y lo pincha')
    },
    onPointerOut: () => onHint(null),
  }

  return (
    <group position={position} {...hintHandlers}>
      {/* Piernas (casi siempre tapadas por el mostrador) */}
      {[-0.1, 0.1].map((x) => (
        <mesh key={x} position={[x, 0.45, 0]} material={materials.pants}>
          <capsuleGeometry args={[0.07, 0.75, 4, 10]} />
        </mesh>
      ))}

      <group ref={body}>
        {/* Torso con sudadera y capucha caída */}
        <mesh position={[0, 1.18, 0]} material={materials.hoodie}>
          <capsuleGeometry args={[0.19, 0.38, 6, 16]} />
        </mesh>
        <mesh position={[0, 1.47, -0.09]} rotation-x={0.5} material={materials.cuff}>
          <torusGeometry args={[0.12, 0.045, 8, 16]} />
        </mesh>
        <mesh position={[0, 1.52, 0]} material={materials.skin}>
          <cylinderGeometry args={[0.055, 0.065, 0.1, 12]} />
        </mesh>

        {/* Cabeza */}
        <group ref={head} position={[0, 1.6, 0]}>
          <mesh position={[0, 0.08, 0]} scale={[0.95, 1.08, 1]} material={materials.skin}>
            <sphereGeometry args={[0.115, 20, 16]} />
          </mesh>
          {/* Barba */}
          <mesh position={[0, 0.02, 0.035]} scale={[0.9, 0.75, 0.9]} material={materials.hair}>
            <sphereGeometry args={[0.105, 16, 12, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55]} />
          </mesh>
          {/* Nariz */}
          <mesh position={[0, 0.075, 0.112]} material={materials.skin}>
            <sphereGeometry args={[0.02, 8, 8]} />
          </mesh>
          {/* Gafas de sol */}
          {[-0.042, 0.042].map((x) => (
            <mesh key={x} position={[x, 0.105, 0.1]} material={materials.glasses}>
              <boxGeometry args={[0.065, 0.032, 0.012]} />
            </mesh>
          ))}
          <mesh position={[0, 0.112, 0.104]} material={materials.glasses}>
            <boxGeometry args={[0.03, 0.008, 0.008]} />
          </mesh>
          {/* Gorro de lana */}
          <mesh position={[0, 0.13, -0.012]} rotation-x={-0.25} scale={[1, 1.22, 1]} material={materials.beanie}>
            <sphereGeometry args={[0.122, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          </mesh>
          <mesh position={[0, 0.13, -0.005]} rotation-x={Math.PI / 2} material={materials.beanie}>
            <cylinderGeometry args={[0.125, 0.125, 0.045, 24, 1, true]} />
          </mesh>
          {/* Pelo asomando por la nuca */}
          <mesh position={[0, 0.08, -0.04]} scale={[0.95, 0.75, 0.9]} material={materials.hair}>
            <sphereGeometry args={[0.115, 14, 10, Math.PI * 0.6, Math.PI * 0.8, Math.PI * 0.3, Math.PI * 0.4]} />
          </mesh>
          {/* Cascos puestos */}
          <mesh position={[0, 0.07, -0.01]} scale={[1, 1.6, 1]} material={materials.phones}>
            <torusGeometry args={[0.14, 0.011, 6, 20, Math.PI]} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.128, 0.07, 0]} rotation-z={Math.PI / 2} material={materials.phones}>
              <cylinderGeometry args={[0.045, 0.045, 0.035, 16]} />
            </mesh>
          ))}
        </group>

        {/* Brazos: hombro → brazo → codo → antebrazo → mano */}
        {[left, right].map((arm, i) => (
          <group key={i} ref={arm.shoulder}>
            <mesh position={[0, -UPPER / 2, 0]} material={materials.hoodie}>
              <capsuleGeometry args={[0.055, UPPER - 0.04, 4, 10]} />
            </mesh>
            <group ref={arm.elbow} position={[0, -UPPER, 0]}>
              <mesh position={[0, -LOWER / 2 + 0.02, 0]} material={materials.hoodie}>
                <capsuleGeometry args={[0.048, LOWER - 0.08, 4, 10]} />
              </mesh>
              <mesh position={[0, -LOWER + 0.04, 0]} material={materials.cuff}>
                <cylinderGeometry args={[0.045, 0.045, 0.04, 10]} />
              </mesh>
              <mesh position={[0, -LOWER - 0.01, 0]} scale={[0.8, 1.1, 0.55]} material={materials.skin}>
                <sphereGeometry args={[0.048, 12, 10]} />
              </mesh>
            </group>
          </group>
        ))}
      </group>
    </group>
  )
}
