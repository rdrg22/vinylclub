import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import type { Album } from '@/types/music'
import {
  backWallZ,
  COVER_SIZE,
  ROW_Y,
  UNIT_WIDTH,
  WALL_X,
  walkBounds,
  type CoverSlot,
  type UnitLayout,
} from './layout'
import { stepNavigation, type NavState } from './navigation'
import { atlasUV, coverGeometry } from './atlas'
import { CounterArea, Crate, Jukebox, NeonSign, Poster, VinylRug, WallRecords } from './Decor'
import type { DecorLayout } from './decorLayout'
import { floorTexture, placeholderTexture, signTexture, sleeveFor, storeSignTexture, yearTagTexture } from './textures'

const CEILING = 3.3

interface SceneProps {
  units: UnitLayout[]
  /** Atlas de portadas cargados, por década. */
  atlases: Record<string, THREE.Texture | null>
  nav: NavState
  reducedMotion: boolean
  onHover: (album: Album | null) => void
  /** Se pasa el objeto de la portada para que el disco salga de su posición exacta. */
  onSelect: (album: Album, object: THREE.Object3D) => void
  /** Discos fuera de su sitio (en la mano o en el tocadiscos): su hueco queda vacío. */
  takenIds: string[]
  decor: DecorLayout
  /** Disco puesto en el tocadiscos y si está sonando. */
  turntableRecord: Album | null
  turntablePlaying: boolean
  holding: boolean
  jukeboxTitles: string[]
  jukeboxGlowing: boolean
  onTurntable: () => void
  onJukebox: () => void
  onHint: (hint: string | null) => void
}

export function StoreScene(props: SceneProps) {
  const { units, atlases, nav, reducedMotion, onHover, onSelect, takenIds, decor, onHint } = props
  const bounds = useMemo(() => ({ ...walkBounds(units), obstacles: decor.obstacles }), [units, decor])
  return (
    <>
      <color attach="background" args={['#1b130c']} />
      <fog attach="fog" args={['#1b130c', 9, 30]} />
      <hemisphereLight args={['#ffe2b8', '#3a2414', 0.9]} />
      <ambientLight intensity={0.25} color="#ffd9a8" />
      <CameraRig nav={nav} bounds={bounds} reducedMotion={reducedMotion} />
      <Room units={units} />
      {units.map((unit) => (
        <ShelfUnit key={unit.decade} unit={unit} atlas={atlases[unit.decade] ?? null} takenIds={takenIds} onHover={onHover} onSelect={onSelect} />
      ))}
      <CounterArea
        layout={decor}
        record={props.turntableRecord}
        playing={props.turntablePlaying}
        holding={props.holding}
        reducedMotion={reducedMotion}
        onTurntable={props.onTurntable}
        onHint={onHint}
      />
      <Jukebox
        layout={decor}
        titles={props.jukeboxTitles}
        glowing={props.jukeboxGlowing}
        reducedMotion={reducedMotion}
        onPlay={props.onJukebox}
        onHint={onHint}
      />
      {decor.crates.map((crate) => (
        <Crate key={crate.label} crate={crate} atlases={atlases} takenIds={takenIds} onSelect={onSelect} onHover={onHover} onHint={onHint} />
      ))}
      {decor.posters.map((poster) => (
        <Poster key={poster.decadeLabel} poster={poster} atlases={atlases} />
      ))}
      <NeonSign z={decor.crates[0]?.z ?? 2} />
      <VinylRug x={decor.rug.x} z={decor.rug.z} />
      <WallRecords z={backWallZ(units)} />
    </>
  )
}

function CameraRig({ nav, bounds, reducedMotion }: { nav: NavState; bounds: ReturnType<typeof walkBounds>; reducedMotion: boolean }) {
  useFrame(({ camera, clock }, delta) => {
    stepNavigation(nav, Math.min(delta, 0.1), bounds, reducedMotion, clock.elapsedTime)
    camera.position.set(nav.x, nav.y, nav.z)
    camera.rotation.set(nav.pitch, nav.yaw, 0, 'YXZ')
  })
  return null
}

// ---------------------------------------------------------------- sala

function Room({ units }: { units: UnitLayout[] }) {
  const bounds = walkBounds(units)
  const backZ = backWallZ(units)
  const frontZ = bounds.maxZ + 0.6
  const length = frontZ - backZ
  const midZ = (frontZ + backZ) / 2
  const width = WALL_X * 2 + 0.4

  const floor = useMemo(() => {
    const t = floorTexture()
    t.repeat.set(width / 1.6, length / 1.6)
    return t
  }, [width, length])
  const storeSign = useMemo(storeSignTexture, [])
  const lampZs = useMemo(() => {
    const zs: number[] = []
    for (let z = frontZ - 2; z > backZ + 1; z -= 4.2) zs.push(z)
    return zs
  }, [frontZ, backZ])

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, midZ]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial map={floor} roughness={0.75} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, CEILING, midZ]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color="#2a1d13" roughness={1} />
      </mesh>
      {/* Paredes laterales, fondo y entrada. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (WALL_X + 0.2), CEILING / 2, midZ]} rotation-y={(-side * Math.PI) / 2}>
          <planeGeometry args={[length, CEILING]} />
          <meshStandardMaterial color="#6b4a30" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, CEILING / 2, backZ]}>
        <planeGeometry args={[width, CEILING]} />
        <meshStandardMaterial color="#5a3d26" roughness={0.9} />
      </mesh>
      <mesh position={[0, CEILING / 2, frontZ]} rotation-y={Math.PI}>
        <planeGeometry args={[width, CEILING]} />
        <meshStandardMaterial color="#5a3d26" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.9, backZ + 0.02]}>
        <planeGeometry args={[3.6, 1.35]} />
        <meshStandardMaterial map={storeSign} emissive="#ffffff" emissiveMap={storeSign} emissiveIntensity={0.35} />
      </mesh>
      {/* Lámparas colgantes de luz cálida. */}
      {lampZs.map((z) => (
        <group key={z} position={[0, CEILING - 0.5, z]}>
          <mesh>
            <coneGeometry args={[0.28, 0.24, 24, 1, true]} />
            <meshStandardMaterial color="#2b2118" side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -0.08, 0]}>
            <sphereGeometry args={[0.08, 16, 12]} />
            <meshBasicMaterial color="#ffe1a8" />
          </mesh>
          <pointLight position={[0, -0.2, 0]} color="#ffcf8f" intensity={9} distance={10} decay={1.6} />
        </group>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------- muebles

function ShelfUnit({ unit, atlas, takenIds, onHover, onSelect }: { unit: UnitLayout; atlas: THREE.Texture | null } & Pick<SceneProps, 'onHover' | 'onSelect' | 'takenIds'>) {
  // Un único material para todas las portadas del mueble: una textura, un shader.
  const atlasMaterial = useMemo(() => (atlas ? new THREE.MeshStandardMaterial({ map: atlas, roughness: 0.55 }) : null), [atlas])
  useEffect(() => () => atlasMaterial?.dispose(), [atlasMaterial])

  const sign = useMemo(() => {
    const years = unit.yearTags.map((t) => t.year)
    const span = years.length ? `${Math.min(...years)}–${Math.max(...years)} · Top 10 Billboard` : ''
    return signTexture(unit.label, span)
  }, [unit])
  const rows = useMemo(() => [...new Set(unit.slots.map((s) => s.y))], [unit.slots])

  return (
    <group position={unit.center} rotation-y={unit.rotationY}>
      {/* Trasera y laterales de madera. */}
      <mesh position={[0, 1.3, -0.03]}>
        <boxGeometry args={[UNIT_WIDTH + 0.3, 2.6, 0.06]} />
        <meshStandardMaterial color="#4a301c" roughness={0.85} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (UNIT_WIDTH / 2 + 0.15), 1.3, 0.1]}>
          <boxGeometry args={[0.06, 2.6, 0.32]} />
          <meshStandardMaterial color="#5c3b22" roughness={0.8} />
        </mesh>
      ))}
      {ROW_Y.map((y) => (
        <mesh key={y} position={[0, y - COVER_SIZE / 2 - 0.02, 0.1]}>
          <boxGeometry args={[UNIT_WIDTH + 0.24, 0.03, 0.3]} />
          <meshStandardMaterial color={rows.includes(y) ? '#7a5232' : '#5c3b22'} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 2.85, 0.02]}>
        <planeGeometry args={[2.6, 0.65]} />
        <meshStandardMaterial map={sign} roughness={0.8} />
      </mesh>
      {unit.yearTags.map((tag) => (
        <YearTag key={tag.year} year={tag.year} x={tag.x} y={tag.y - COVER_SIZE / 2 - 0.035} />
      ))}
      {unit.slots.map((slot) => (
        <Cover key={slot.album.id} slot={slot} atlasMaterial={atlasMaterial} hidden={takenIds.includes(slot.album.id)} onHover={onHover} onSelect={onSelect} />
      ))}
    </group>
  )
}

function YearTag({ year, x, y }: { year: number; x: number; y: number }) {
  const texture = useMemo(() => yearTagTexture(year), [year])
  return (
    <mesh position={[x, y, 0.255]}>
      <planeGeometry args={[0.16, 0.06]} />
      <meshStandardMaterial map={texture} roughness={0.9} />
    </mesh>
  )
}

const plainCoverGeometry = new THREE.PlaneGeometry(COVER_SIZE, COVER_SIZE)

interface CoverProps extends Pick<SceneProps, 'onHover' | 'onSelect'> {
  slot: CoverSlot
  /** Material compartido del mueble con el atlas de su década (null mientras carga). */
  atlasMaterial: THREE.Material | null
  hidden: boolean
}

function Cover({ slot, atlasMaterial, hidden, onHover, onSelect }: CoverProps) {
  const { album } = slot
  const [hovered, setHovered] = useState(false)
  const uv = useMemo(() => atlasUV(album.id), [album.id])
  const geometry = useMemo(() => (uv ? coverGeometry(COVER_SIZE, uv) : plainCoverGeometry), [uv])
  useEffect(() => () => {
    if (geometry !== plainCoverGeometry) geometry.dispose()
  }, [geometry])
  // Sin hueco en el atlas (disco sin portada): funda tipográfica propia.
  const placeholder = useMemo(() => (uv ? null : placeholderTexture(album)), [uv, album])

  return (
    <mesh
      visible={!hidden}
      geometry={geometry}
      material={uv && atlasMaterial ? atlasMaterial : undefined}
      position={[slot.x, slot.y + (hovered ? 0.04 : 0), hovered ? 0.2 : 0.12]}
      rotation-x={hovered ? 0 : -0.1}
      scale={hovered ? 1.08 : 1}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        setHovered(true)
        onHover(album)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        onHover(null)
        document.body.style.cursor = ''
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        // Un arrastre para mirar alrededor no cuenta como clic.
        if (e.delta > 6 || hidden) return
        setHovered(false)
        onHover(null)
        document.body.style.cursor = ''
        onSelect(album, e.object)
      }}
    >
      {!(uv && atlasMaterial) &&
        (placeholder ? (
          <meshStandardMaterial map={placeholder} roughness={0.55} />
        ) : (
          // Mientras llega el atlas: color de funda.
          <meshStandardMaterial color={sleeveFor(album).bg} roughness={0.55} />
        ))}
    </mesh>
  )
}
