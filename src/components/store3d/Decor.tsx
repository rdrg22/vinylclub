/**
 * Decoración de la tienda: mostrador con tocadiscos, gramola, cubetas, pósters,
 * altavoces, alfombra-vinilo y neón. Todo hecho con geometría simple y texturas de canvas.
 */
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Album } from '@/types/music'
import { atlasUV, coverGeometry } from './atlas'
import { CounterToys } from './CounterToys'
import { COUNTER, PLATTER_Y, type CrateSpot, type DecorLayout, type PosterSpot } from './decorLayout'
import { createScreenTexture, drawScreen, marqueeSignTexture, type ScreenState } from './jukeboxScreen'
import { COVER_SIZE, WALL_X } from './layout'
import {
  discLabelTexture,
  grilleTexture,
  labelCardTexture,
  neonTexture,
  posterTexture,
  rugTexture,
} from './textures'

const decadeOf = (album: Album) => `${Math.floor((album.charts?.[0]?.year ?? 0) / 10) * 10}s`

/** Clic que no sea un arrastre de cámara. */
const isClick = (e: ThreeEvent<MouseEvent>) => {
  e.stopPropagation()
  return e.delta <= 6
}

interface HintHandlers {
  onHint: (hint: string | null) => void
}

const hintProps = (onHint: HintHandlers['onHint'], text: string) => ({
  onPointerOver: (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    onHint(text)
    document.body.style.cursor = 'pointer'
  },
  onPointerOut: () => {
    onHint(null)
    document.body.style.cursor = ''
  },
})

// ---------------------------------------------------------------- mostrador y tocadiscos

interface CounterProps extends HintHandlers {
  layout: DecorLayout
  /** Disco puesto en el tocadiscos. */
  record: Album | null
  playing: boolean
  holding: boolean
  reducedMotion: boolean
  onTurntable: () => void
}

export function CounterArea({ layout, record, playing, holding, reducedMotion, onTurntable, onHint }: CounterProps) {
  const { counter, turntable } = layout
  const sign = useMemo(() => labelCardTexture('Escucha aquí', 'Pon un disco en el plato'), [])
  const grille = useMemo(() => grilleTexture(), [])
  return (
    <group>
      {/* Mostrador */}
      <mesh position={[counter.x, COUNTER.height / 2, counter.z]}>
        <boxGeometry args={[COUNTER.width, COUNTER.height, COUNTER.depth]} />
        <meshStandardMaterial color="#4a2e1a" roughness={0.8} />
      </mesh>
      <mesh position={[counter.x, COUNTER.height + 0.015, counter.z]}>
        <boxGeometry args={[COUNTER.width + 0.1, 0.03, COUNTER.depth + 0.08]} />
        <meshStandardMaterial color="#8a5a34" roughness={0.5} />
      </mesh>
      <mesh position={[counter.x - 0.55, 0.62, counter.z + COUNTER.depth / 2 + 0.005]}>
        <planeGeometry args={[0.9, 0.28]} />
        <meshStandardMaterial map={sign} roughness={0.9} />
      </mesh>

      {/* Caja registradora */}
      <group position={[counter.x - 0.95, COUNTER.height + 0.03, counter.z - 0.05]}>
        <mesh position={[0, 0.09, 0]}>
          <boxGeometry args={[0.42, 0.18, 0.36]} />
          <meshStandardMaterial color="#7c1f14" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.24, -0.08]} rotation-x={-0.5}>
          <boxGeometry args={[0.36, 0.14, 0.04]} />
          <meshStandardMaterial color="#c9a45c" metalness={0.6} roughness={0.35} />
        </mesh>
      </group>

      <Turntable
        position={[turntable.x, PLATTER_Y, turntable.z]}
        record={record}
        playing={playing}
        reducedMotion={reducedMotion}
        onClick={onTurntable}
        onHint={onHint}
        hint={holding ? 'Pon el disco en el tocadiscos' : record ? `Tocadiscos: «${record.title}»` : 'Tocadiscos: coge un disco y ponlo aquí'}
      />

      <CounterToys x={counter.x} z={counter.z} playing={playing} reducedMotion={reducedMotion} onHint={onHint} />

      {/* Altavoces a los lados */}
      {[-1, 1].map((side) => (
        <group key={side} position={[counter.x + side * (COUNTER.width / 2 + 0.55), 0, counter.z]}>
          <mesh position={[0, 0.65, 0]}>
            <boxGeometry args={[0.55, 1.3, 0.45]} />
            <meshStandardMaterial color="#2a1d13" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.65, 0.226]}>
            <planeGeometry args={[0.47, 1.2]} />
            <meshStandardMaterial map={grille} roughness={1} />
          </mesh>
          {[0.95, 0.42].map((y, i) => (
            <mesh key={y} position={[0, y, 0.235]} rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[i === 0 ? 0.09 : 0.17, i === 0 ? 0.09 : 0.17, 0.02, 32]} />
              <meshStandardMaterial color="#121110" roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

interface TurntableProps extends HintHandlers {
  position: [number, number, number]
  record: Album | null
  playing: boolean
  reducedMotion: boolean
  hint: string
  onClick: () => void
}

function Turntable({ position, record, playing, reducedMotion, hint, onClick, onHint }: TurntableProps) {
  const disc = useRef<THREE.Mesh>(null)
  const arm = useRef<THREE.Group>(null)
  const label = useMemo(() => (record ? discLabelTexture(record) : null), [record])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    if (disc.current && playing && !reducedMotion) disc.current.rotation.y -= dt * 3.5
    if (arm.current) {
      // El brazo se posa sobre el disco al sonar.
      const target = playing ? -0.42 : 0
      arm.current.rotation.y += (target - arm.current.rotation.y) * Math.min(1, dt * 3)
    }
  })

  const [x, y, z] = position
  return (
    <group
      position={[x, y - 0.11, z]}
      onClick={(e: ThreeEvent<MouseEvent>) => isClick(e) && onClick()}
      {...hintProps(onHint, hint)}
    >
      {/* Peana */}
      <mesh position={[0, 0.045, 0]}>
        <boxGeometry args={[0.46, 0.09, 0.37]} />
        <meshStandardMaterial color="#1d1b19" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Plato y alfombrilla */}
      <mesh position={[-0.04, 0.1, 0]}>
        <cylinderGeometry args={[0.155, 0.155, 0.02, 48]} />
        <meshStandardMaterial color="#9a9a96" metalness={0.8} roughness={0.3} />
      </mesh>
      {record && label && (
        <mesh ref={disc} position={[-0.04, 0.113, 0]}>
          <cylinderGeometry args={[0.148, 0.148, 0.004, 64]} />
          <meshBasicMaterial attach="material-0" color="#141210" />
          <meshBasicMaterial attach="material-1" map={label} />
          <meshBasicMaterial attach="material-2" color="#141210" />
        </mesh>
      )}
      {/* Brazo */}
      <group ref={arm} position={[0.17, 0.12, -0.12]}>
        <mesh position={[0, 0, 0.12]}>
          <boxGeometry args={[0.012, 0.012, 0.24]} />
          <meshStandardMaterial color="#d4d2cc" metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.006, 0.245]}>
          <boxGeometry args={[0.03, 0.012, 0.03]} />
          <meshStandardMaterial color="#1d1b19" />
        </mesh>
      </group>
      {/* Piloto: rojo encendido mientras suena */}
      <mesh position={[0.19, 0.092, 0.16]}>
        <sphereGeometry args={[0.008, 12, 8]} />
        <meshBasicMaterial color={playing ? '#ff3b26' : '#4a1a12'} />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------- gramola

interface JukeboxProps extends HintHandlers {
  layout: DecorLayout
  /** Lo que muestra la pantalla (sin el progreso, que se lee del audio en cada fotograma). */
  screen: Omit<ScreenState, 'progress' | 'current' | 'duration'>
  /** Elemento de audio de las demos: de él sale el progreso real. */
  audio: HTMLAudioElement | null
  /** Suena lo que eligió la gramola: las luces laten. */
  glowing: boolean
  reducedMotion: boolean
  onPlay: () => void
}

/** Cada cuánto se redibuja la pantalla (≈ 15 fps: suficiente para el pixel-art). */
const SCREEN_FRAME = 1 / 15

export function Jukebox({ layout, screen, audio, glowing, reducedMotion, onPlay, onHint }: JukeboxProps) {
  const grille = useMemo(() => grilleTexture(), [])
  const sign = useMemo(() => marqueeSignTexture(), [])
  const display = useMemo(() => createScreenTexture(), [])
  useEffect(() => () => display.texture.dispose(), [display])
  const lastDraw = useRef(-1)
  const bands = useRef<THREE.MeshBasicMaterial[]>([])
  const colors = ['#ff6a2b', '#ffc34d', '#ff2f6d']

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    bands.current.forEach((material, i) => {
      const pulse = glowing && !reducedMotion ? 0.65 + 0.35 * Math.sin(t * 4 + i) : glowing ? 1 : 0.55
      material.color.set(colors[i] ?? '#ffffff').multiplyScalar(pulse)
    })
    if (!display.ctx || t - lastDraw.current < SCREEN_FRAME) return
    lastDraw.current = t
    const playingNow = screen.status === 'playing' || screen.status === 'paused'
    const duration = audio && Number.isFinite(audio.duration) ? audio.duration : 30
    drawScreen(
      display.ctx,
      {
        ...screen,
        current: playingNow && audio ? audio.currentTime : 0,
        duration,
        progress: playingNow && audio ? audio.currentTime / duration : 0,
      },
      // Con movimiento reducido, la pantalla no se anima (ni marquesina ni ecualizador).
      reducedMotion ? 0 : t,
    )
    display.texture.needsUpdate = true
  })

  const { x, z, rotationY } = layout.jukebox
  return (
    <group
      position={[x, 0, z]}
      rotation-y={rotationY}
      onClick={(e: ThreeEvent<MouseEvent>) => isClick(e) && onPlay()}
      {...hintProps(onHint, 'Gramola: pulsa para que suene un nº 1')}
    >
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.92, 1.1, 0.6]} />
        <meshStandardMaterial color="#5a2a17" roughness={0.45} metalness={0.2} />
      </mesh>
      {/* Remate redondo */}
      <mesh position={[0, 1.1, 0]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.46, 0.46, 0.6, 40, 1, false, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color="#5a2a17" roughness={0.45} metalness={0.2} side={THREE.DoubleSide} />
      </mesh>
      {/* Arcos de luz */}
      {colors.map((color, i) => (
        <mesh key={color} position={[0, 1.1, 0.305 + i * 0.002]}>
          <torusGeometry args={[0.4 - i * 0.07, 0.022, 10, 40, Math.PI]} />
          <meshBasicMaterial ref={(m) => void (m && (bands.current[i] = m))} color={color} />
        </mesh>
      ))}
      <mesh position={[0, 1.15, 0.302]}>
        <circleGeometry args={[0.25, 32, 0, Math.PI]} />
        <meshBasicMaterial map={sign} toneMapped={false} />
      </mesh>
      {/* Monitor CRT: carcasa beige, cristal y pantalla pixel-art que se ilumina sola. */}
      <group position={[0, 0.8, 0.31]}>
        <mesh position={[0, 0, -0.005]}>
          <boxGeometry args={[0.6, 0.47, 0.03]} />
          <meshStandardMaterial color="#d9cdb4" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.01, 0.011]}>
          <planeGeometry args={[0.52, 0.39]} />
          <meshBasicMaterial color="#120c07" />
        </mesh>
        <mesh position={[0, 0.01, 0.013]}>
          <planeGeometry args={[0.48, 0.36]} />
          <meshBasicMaterial map={display.texture} toneMapped={false} />
        </mesh>
        {/* Piloto de encendido */}
        <mesh position={[0.24, -0.205, 0.012]}>
          <circleGeometry args={[0.008, 12]} />
          <meshBasicMaterial color={glowing ? '#ff3b26' : '#7a2a1a'} />
        </mesh>
      </group>
      <mesh position={[0, 0.32, 0.302]}>
        <planeGeometry args={[0.7, 0.42]} />
        <meshStandardMaterial map={grille} roughness={1} />
      </mesh>
      <pointLight position={[0, 1.1, 0.6]} color="#ff7a3c" intensity={glowing ? 2.5 : 1} distance={3} decay={1.8} />
    </group>
  )
}

// ---------------------------------------------------------------- cubetas

interface CrateProps extends HintHandlers {
  crate: CrateSpot
  atlases: Record<string, THREE.Texture | null>
  takenIds: string[]
  onSelect: (album: Album, object: THREE.Object3D) => void
  onHover: (album: Album | null) => void
}

export function Crate({ crate, atlases, takenIds, onSelect, onHover }: CrateProps) {
  const label = useMemo(() => labelCardTexture(crate.label), [crate.label])
  const materials = useMemo(() => {
    const map = new Map<string, THREE.MeshStandardMaterial>()
    for (const album of crate.albums) {
      const decade = decadeOf(album)
      const atlas = atlases[decade]
      if (atlas && !map.has(decade)) map.set(decade, new THREE.MeshStandardMaterial({ map: atlas, roughness: 0.55 }))
    }
    return map
  }, [crate.albums, atlases])
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials])

  const width = 0.42
  const depth = 0.75
  return (
    <group position={[crate.x, 0, crate.z]} rotation-y={crate.rotationY}>
      {/* Caja de madera con patas */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[depth, 0.02, width]} />
        <meshStandardMaterial color="#6e4528" roughness={0.8} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`side${s}`} position={[0, 0.66, s * (width / 2)]}>
          <boxGeometry args={[depth, 0.22, 0.02]} />
          <meshStandardMaterial color="#7a4d2c" roughness={0.8} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`end${s}`} position={[s * (depth / 2), 0.66, 0]}>
          <boxGeometry args={[0.02, 0.22, width]} />
          <meshStandardMaterial color="#7a4d2c" roughness={0.8} />
        </mesh>
      ))}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (depth / 2 - 0.03), 0.27, sz * (width / 2 - 0.03)]}>
            <boxGeometry args={[0.04, 0.54, 0.04]} />
            <meshStandardMaterial color="#4a2e1a" />
          </mesh>
        )),
      )}
      <mesh position={[depth / 2 + 0.012, 0.66, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[0.36, 0.11]} />
        <meshStandardMaterial map={label} roughness={0.9} />
      </mesh>
      {/* Dos pilas de discos de pie, de cara al pasillo (+z local): el de delante se ve
          entero y de los de detrás asoma el borde superior, como al rebuscar. */}
      {crate.albums.map((album, i) => {
        const uv = atlasUV(album.id)
        const material = materials.get(decadeOf(album))
        if (!uv || !material) return null
        const column = i % 2
        const depthIndex = Math.floor(i / 2)
        return (
          <CrateRecord
            key={album.id}
            album={album}
            uv={uv}
            material={material}
            hidden={takenIds.includes(album.id)}
            position={[column === 0 ? -0.18 : 0.18, 0.725 + depthIndex * 0.022, width / 2 - 0.05 - depthIndex * 0.05]}
            onSelect={onSelect}
            onHover={onHover}
          />
        )
      })}
    </group>
  )
}

function CrateRecord({
  album,
  uv,
  material,
  hidden,
  position,
  onSelect,
  onHover,
}: {
  album: Album
  uv: [number, number, number, number]
  material: THREE.Material
  hidden: boolean
  position: [number, number, number]
  onSelect: CrateProps['onSelect']
  onHover: CrateProps['onHover']
}) {
  const geometry = useMemo(() => coverGeometry(COVER_SIZE, uv), [uv])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh
      visible={!hidden}
      geometry={geometry}
      material={material}
      position={position}
      // De pie, mirando al pasillo e inclinados hacia atrás como en una cubeta.
      rotation={[-0.28, 0, 0]}
      onPointerOver={(e) => {
        e.stopPropagation()
        onHover(album)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        onHover(null)
        document.body.style.cursor = ''
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (!isClick(e) || hidden) return
        onHover(null)
        document.body.style.cursor = ''
        onSelect(album, e.object)
      }}
    />
  )
}

// ---------------------------------------------------------------- pósters, neón, alfombra, discos de pared

export function Poster({ poster, atlases }: { poster: PosterSpot; atlases: Record<string, THREE.Texture | null> }) {
  const atlas = atlases[decadeOf(poster.album)] ?? null
  const texture = useMemo(
    () => posterTexture(poster.album, poster.year, poster.decadeLabel, atlas, atlasUV(poster.album.id)),
    [poster, atlas],
  )
  return (
    <group position={[poster.x, 1.75, poster.z]} rotation-y={poster.rotationY}>
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[0.66, 0.96, 0.02]} />
        <meshStandardMaterial color="#1f150d" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <planeGeometry args={[0.6, 0.9]} />
        <meshStandardMaterial map={texture} roughness={0.8} />
      </mesh>
    </group>
  )
}

export function NeonSign({ z }: { z: number }) {
  const texture = useMemo(() => neonTexture('Vinilos', '#ff3f6c'), [])
  return (
    <group position={[-WALL_X - 0.18, 2.35, z]} rotation-y={Math.PI / 2}>
      <mesh>
        <planeGeometry args={[1.8, 0.45]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0, 0.4]} color="#ff3f6c" intensity={1.4} distance={3} decay={1.8} />
    </group>
  )
}

export function VinylRug({ x, z }: { x: number; z: number }) {
  const texture = useMemo(() => rugTexture(), [])
  return (
    <mesh position={[x, 0.006, z]} rotation-x={-Math.PI / 2}>
      <circleGeometry args={[1.25, 64]} />
      <meshStandardMaterial map={texture} transparent roughness={1} />
    </mesh>
  )
}

/** Discos dorados enmarcados en la pared del fondo (decoración, sin certificaciones inventadas). */
export function WallRecords({ z }: { z: number }) {
  return (
    <group>
      {[-2.25, 2.25].map((x) => (
        <group key={x} position={[x, 1.9, z + 0.03]}>
          <mesh>
            <boxGeometry args={[0.62, 0.78, 0.03]} />
            <meshStandardMaterial color="#1f150d" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.06, 0.02]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.24, 0.24, 0.01, 48]} />
            <meshStandardMaterial color="#d4a43a" metalness={0.9} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.06, 0.027]}>
            <circleGeometry args={[0.07, 32]} />
            <meshStandardMaterial color="#d8402a" roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.28, 0.018]}>
            <planeGeometry args={[0.4, 0.08]} />
            <meshStandardMaterial color="#c9a45c" metalness={0.7} roughness={0.35} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
