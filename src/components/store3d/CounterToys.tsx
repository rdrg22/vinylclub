/**
 * Guiños de cultura pop sobre el mostrador del DJ. Son objetos genéricos (sin
 * personajes ni marcas registradas) hechos con geometría simple: figuras de acción
 * que cabecean al ritmo cuando suena el tocadiscos, bola de discoteca, lámpara de
 * lava, cubo de colores, casete con lápiz, consola portátil y cascos.
 */
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { COUNTER } from './decorLayout'

const TOP = COUNTER.height + 0.03

interface ToysProps {
  /** Centro del mostrador en el mundo. */
  x: number
  z: number
  /** Suena el tocadiscos: las figuras siguen el ritmo. */
  playing: boolean
  reducedMotion: boolean
  onHint: (hint: string | null) => void
}

const hint = (onHint: ToysProps['onHint'], text: string) => ({
  onPointerOver: (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    onHint(text)
  },
  onPointerOut: () => onHint(null),
})

export function CounterToys({ x, z, playing, reducedMotion, onHint }: ToysProps) {
  return (
    <group position={[x, 0, z]}>
      <ToyRobot position={[-0.38, TOP, 0.12]} playing={playing} reducedMotion={reducedMotion} onHint={onHint} />
      <Astronaut position={[1.42, TOP, 0.12]} playing={playing} reducedMotion={reducedMotion} onHint={onHint} />
      <LavaLamp position={[-1.45, TOP, -0.12]} reducedMotion={reducedMotion} onHint={onHint} />
      <PuzzleCube position={[-0.6, TOP, -0.12]} onHint={onHint} />
      <Cassette position={[0.12, TOP, 0.16]} onHint={onHint} />
      <Handheld position={[-0.1, TOP, -0.16]} onHint={onHint} />
      <Headphones position={[1.18, TOP, -0.16]} onHint={onHint} />
      <DiscoBall position={[0, 2.75, 0]} playing={playing} reducedMotion={reducedMotion} onHint={onHint} />
    </group>
  )
}

/** Cabeceo al ritmo: unos 120 bpm mientras suena; quieto si no. */
function useBob(playing: boolean, reducedMotion: boolean, offset = 0) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const target = playing && !reducedMotion ? Math.sin(clock.elapsedTime * Math.PI * 4 + offset) * 0.22 : 0
    ref.current.rotation.x += (target - ref.current.rotation.x) * 0.25
  })
  return ref
}

// ---------------------------------------------------------------- figuras de acción

function ToyRobot({ position, playing, reducedMotion, onHint }: { position: [number, number, number] } & Omit<ToysProps, 'x' | 'z'>) {
  const head = useBob(playing, reducedMotion)
  const antenna = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(({ clock }) => {
    // Piloto de la antena: parpadea siempre; rápido si hay música.
    if (antenna.current) antenna.current.color.set(Math.sin(clock.elapsedTime * (playing ? 12 : 3)) > 0 ? '#ff3b26' : '#5a1810')
  })
  const tin = { color: '#b9b4ab', metalness: 0.7, roughness: 0.35 }
  return (
    <group position={position} rotation-y={0.35} scale={1.4} {...hint(onHint, 'Robot de hojalata: baila si pones un disco')}>
      {/* Piernas y cuerpo */}
      {[-0.025, 0.025].map((lx) => (
        <mesh key={lx} position={[lx, 0.035, 0]}>
          <boxGeometry args={[0.03, 0.07, 0.035]} />
          <meshStandardMaterial {...tin} />
        </mesh>
      ))}
      <mesh position={[0, 0.115, 0]}>
        <boxGeometry args={[0.1, 0.09, 0.06]} />
        <meshStandardMaterial color="#d8402a" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.12, 0.031]}>
        <planeGeometry args={[0.05, 0.035]} />
        <meshStandardMaterial color="#e8c98f" metalness={0.6} roughness={0.3} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.065, 0.11, 0]} rotation-z={s * 0.25}>
          <boxGeometry args={[0.025, 0.07, 0.025]} />
          <meshStandardMaterial {...tin} />
        </mesh>
      ))}
      {/* Cabeza con visor y antena: cabecea al ritmo */}
      <group ref={head} position={[0, 0.16, 0]}>
        <mesh position={[0, 0.035, 0]}>
          <boxGeometry args={[0.075, 0.065, 0.065]} />
          <meshStandardMaterial {...tin} />
        </mesh>
        <mesh position={[0, 0.04, 0.0335]}>
          <planeGeometry args={[0.055, 0.02]} />
          <meshBasicMaterial color="#7fe3ff" />
        </mesh>
        <mesh position={[0, 0.085, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 0.035, 6]} />
          <meshStandardMaterial {...tin} />
        </mesh>
        <mesh position={[0, 0.105, 0]}>
          <sphereGeometry args={[0.008, 10, 8]} />
          <meshBasicMaterial ref={antenna} color="#ff3b26" />
        </mesh>
      </group>
    </group>
  )
}

function Astronaut({ position, playing, reducedMotion, onHint }: { position: [number, number, number] } & Omit<ToysProps, 'x' | 'z'>) {
  const head = useBob(playing, reducedMotion, Math.PI / 2)
  const suit = { color: '#efece4', roughness: 0.6 }
  return (
    <group position={position} rotation-y={-0.4} scale={1.4} {...hint(onHint, 'Astronauta de juguete: también sigue el ritmo')}>
      {[-0.022, 0.022].map((lx) => (
        <mesh key={lx} position={[lx, 0.035, 0]}>
          <cylinderGeometry args={[0.016, 0.018, 0.07, 10]} />
          <meshStandardMaterial {...suit} />
        </mesh>
      ))}
      <mesh position={[0, 0.115, 0]}>
        <capsuleGeometry args={[0.042, 0.04, 4, 12]} />
        <meshStandardMaterial {...suit} />
      </mesh>
      <mesh position={[0, 0.12, -0.045]}>
        <boxGeometry args={[0.06, 0.07, 0.03]} />
        <meshStandardMaterial color="#c9c4b8" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.125, 0.04]}>
        <boxGeometry args={[0.03, 0.02, 0.006]} />
        <meshStandardMaterial color="#d8402a" />
      </mesh>
      <group ref={head} position={[0, 0.17, 0]}>
        <mesh position={[0, 0.03, 0]}>
          <sphereGeometry args={[0.042, 20, 16]} />
          <meshStandardMaterial {...suit} />
        </mesh>
        {/* Visor dorado */}
        <mesh position={[0, 0.032, 0.02]} scale={[1, 0.75, 0.6]}>
          <sphereGeometry args={[0.032, 20, 16]} />
          <meshStandardMaterial color="#d4a43a" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>
    </group>
  )
}

// ---------------------------------------------------------------- objetos

function LavaLamp({ position, reducedMotion, onHint }: { position: [number, number, number]; reducedMotion: boolean; onHint: ToysProps['onHint'] }) {
  const blobs = useRef<THREE.Mesh[]>([])
  useFrame(({ clock }) => {
    if (reducedMotion) return
    blobs.current.forEach((blob, i) => {
      blob.position.y = 0.16 + Math.sin(clock.elapsedTime * 0.5 + i * 2.1) * 0.07
      const s = 1 + 0.15 * Math.sin(clock.elapsedTime * 0.8 + i)
      blob.scale.set(s, 1.2 / s, s)
    })
  })
  return (
    <group position={position} scale={1.3} {...hint(onHint, 'Lámpara de lava: los 70 nunca se fueron')}>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.035, 0.06, 0.08, 20]} />
        <meshStandardMaterial color="#c9a45c" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.03, 0.042, 0.18, 20]} />
        <meshStandardMaterial color="#ff8a3d" transparent opacity={0.35} roughness={0.1} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(m) => void (m && (blobs.current[i] = m))} position={[(i - 1) * 0.008, 0.16, 0]}>
          <sphereGeometry args={[0.014 + i * 0.003, 14, 10]} />
          <meshBasicMaterial color="#ff4d2e" />
        </mesh>
      ))}
      <mesh position={[0, 0.275, 0]}>
        <cylinderGeometry args={[0.012, 0.03, 0.04, 20]} />
        <meshStandardMaterial color="#c9a45c" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

const CUBE_COLORS = ['#d8402a', '#f2b01e', '#2f7d4f', '#2a5fb0', '#f3f0e8', '#e8762c']

function PuzzleCube({ position, onHint }: { position: [number, number, number]; onHint: ToysProps['onHint'] }) {
  const size = 0.06
  // Pegatinas desordenadas, pero siempre las mismas (como un cubo a medio resolver).
  const stickers = useMemo(
    () =>
      Array.from({ length: 27 }, (_, i) => CUBE_COLORS[(i * 7 + Math.floor(i / 3)) % CUBE_COLORS.length] ?? '#ffffff'),
    [],
  )
  const cell = size / 3
  const faces: Array<{ rotation: [number, number, number]; position: [number, number, number] }> = [
    { rotation: [0, 0, 0], position: [0, 0, size / 2 + 0.0005] },
    { rotation: [-Math.PI / 2, 0, 0], position: [0, size / 2 + 0.0005, 0] },
    { rotation: [0, Math.PI / 2, 0], position: [size / 2 + 0.0005, 0, 0] },
  ]
  return (
    <group position={[position[0], position[1] + (size * 1.4) / 2, position[2]]} rotation={[0, 0.6, 0]} scale={1.4} {...hint(onHint, 'Cubo de colores a medio resolver')}>
      <mesh>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color="#111" roughness={0.5} />
      </mesh>
      {faces.map((face, f) => (
        <group key={f} position={face.position} rotation={face.rotation}>
          {Array.from({ length: 9 }, (_, i) => (
            <mesh key={i} position={[((i % 3) - 1) * cell, (Math.floor(i / 3) - 1) * cell, 0]}>
              <planeGeometry args={[cell * 0.86, cell * 0.86]} />
              <meshStandardMaterial color={stickers[f * 9 + i]} roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function Cassette({ position, onHint }: { position: [number, number, number]; onHint: ToysProps['onHint'] }) {
  return (
    <group position={position} rotation={[0, -0.3, 0]} scale={1.3} {...hint(onHint, 'Casete y lápiz: para rebobinar como en los 80')}>
      <mesh position={[0, 0.006, 0]}>
        <boxGeometry args={[0.1, 0.012, 0.064]} />
        <meshStandardMaterial color="#1f1d1a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.0125, -0.008]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.084, 0.034]} />
        <meshStandardMaterial color="#efe6d2" roughness={0.8} />
      </mesh>
      {[-0.022, 0.022].map((rx) => (
        <mesh key={rx} position={[rx, 0.013, -0.008]}>
          <cylinderGeometry args={[0.009, 0.009, 0.002, 16]} />
          <meshStandardMaterial color="#3b2a1c" />
        </mesh>
      ))}
      {/* Lápiz amarillo metido en una bobina */}
      <group position={[-0.022, 0.016, -0.008]} rotation={[0, 0.5, Math.PI / 2 - 0.25]}>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.0035, 0.0035, 0.12, 6]} />
          <meshStandardMaterial color="#f2b01e" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.125, 0]}>
          <coneGeometry args={[0.0035, 0.012, 6]} />
          <meshStandardMaterial color="#e2c79a" />
        </mesh>
        <mesh position={[0, -0.003, 0]}>
          <cylinderGeometry args={[0.0036, 0.0036, 0.008, 8]} />
          <meshStandardMaterial color="#e88a9b" />
        </mesh>
      </group>
    </group>
  )
}

function Handheld({ position, onHint }: { position: [number, number, number]; onHint: ToysProps['onHint'] }) {
  return (
    <group position={position} rotation={[-Math.PI / 2 + 0.15, 0, 0.35]} scale={1.4} {...hint(onHint, 'Consola portátil: pilas incluidas')}>
      <mesh position={[0, 0, 0.008]}>
        <boxGeometry args={[0.07, 0.11, 0.016]} />
        <meshStandardMaterial color="#c8c4bb" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.022, 0.0165]}>
        <planeGeometry args={[0.05, 0.042]} />
        <meshBasicMaterial color="#8fa66a" />
      </mesh>
      {/* Cruceta y botones */}
      <mesh position={[-0.018, -0.03, 0.017]}>
        <boxGeometry args={[0.018, 0.006, 0.003]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[-0.018, -0.03, 0.017]}>
        <boxGeometry args={[0.006, 0.018, 0.003]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {[0.012, 0.024].map((bx, i) => (
        <mesh key={bx} position={[bx, -0.028 + i * 0.006, 0.017]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.005, 0.005, 0.003, 12]} />
          <meshStandardMaterial color="#9b2257" />
        </mesh>
      ))}
    </group>
  )
}

function Headphones({ position, onHint }: { position: [number, number, number]; onHint: ToysProps['onHint'] }) {
  return (
    <group position={position} rotation={[0, 0.5, 0]} {...hint(onHint, 'Cascos de DJ')}>
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2}>
        <torusGeometry args={[0.07, 0.008, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#1d1b19" roughness={0.4} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.07, 0.018, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.03, 0.03, 0.025, 20]} />
          <meshStandardMaterial color="#2a2724" roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function DiscoBall({ position, playing, reducedMotion, onHint }: { position: [number, number, number] } & Omit<ToysProps, 'x' | 'z'>) {
  const ball = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (ball.current && !reducedMotion) ball.current.rotation.y += Math.min(delta, 0.05) * (playing ? 1.2 : 0.3)
  })
  return (
    <group position={position} {...hint(onHint, 'Bola de discoteca: gira más deprisa con música')}>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.5, 6]} />
        <meshStandardMaterial color="#666" />
      </mesh>
      <mesh ref={ball}>
        <icosahedronGeometry args={[0.16, 2]} />
        <meshStandardMaterial color="#d6d6d2" metalness={0.85} roughness={0.18} flatShading emissive="#3a2a1a" emissiveIntensity={0.4} />
      </mesh>
    </group>
  )
}
