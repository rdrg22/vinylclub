import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import type { Album } from '@/types/music'
import {
  backWallZ,
  COLLECTION_KEY,
  COVER_SIZE,
  ROW_Y,
  UNIT_WIDTH,
  WALL_X,
  walkBounds,
  type CoverSlot,
  type UnitLayout,
} from './layout'
import { stepNavigation, type NavState } from './navigation'
import { atlasUV } from './atlas'
import { CoverInstances } from './CoverInstances'
import { CounterArea, Crate, Jukebox, NeonSign, Poster, VinylRug, WallRecords } from './Decor'
import type { DecorLayout } from './decorLayout'
import type { ScreenState } from './jukeboxScreen'
import { InteriorEnvironment } from './Lighting'
import type { Quality } from './quality'
import { SurfacesProvider, useSurface } from './surfaces'
import { coverUrlFor } from '@/services/coverArt'
import { labelCardTexture, loadRemoteTexture, placeholderTexture, signTexture, sleeveFor, storeSignTexture, yearTagTexture } from './textures'

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
  jukeboxScreen: Omit<ScreenState, 'progress' | 'current' | 'duration'>
  audio: HTMLAudioElement | null
  jukeboxGlowing: boolean
  onTurntable: () => void
  onJukebox: () => void
  onHint: (hint: string | null) => void
  quality: Quality
}

export function StoreScene(props: SceneProps) {
  const { units, atlases, nav, reducedMotion, onHover, onSelect, takenIds, decor, onHint } = props
  const bounds = useMemo(() => ({ ...walkBounds(units), obstacles: decor.obstacles }), [units, decor])
  return (
    <SurfacesProvider quality={props.quality}>
      <color attach="background" args={['#120c07']} />
      <fog attach="fog" args={['#120c07', 14, 40]} />
      <InteriorEnvironment intensity={props.quality === 'high' ? 0.45 : 0.6} />
      <hemisphereLight args={['#ffe2b8', '#2a1a0e', 0.35]} />
      <ambientLight intensity={0.08} color="#ffd9a8" />
      <CameraRig nav={nav} bounds={bounds} reducedMotion={reducedMotion} />
      <StaticShadows version={`${Object.keys(atlases).length}|${takenIds.join(',')}|${units.at(-1)?.slots.length ?? 0}`} />
      <Room units={units} quality={props.quality} />
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
        screen={props.jukeboxScreen}
        audio={props.audio}
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
    </SurfacesProvider>
  )
}

/**
 * Las sombras de muebles y discos no cambian de un fotograma a otro: se calculan una vez
 * y solo se rehacen cuando cambia la escena (llegan portadas, se coge o devuelve un disco).
 * Ahorra varias pasadas completas de la escena por fotograma.
 */
function StaticShadows({ version }: { version: string }) {
  const gl = useThree((state) => state.gl)
  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
  }, [gl, version])
  return null
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

/** Lámpara colgante industrial: cable, pantalla metálica, bombilla que brilla y foco hacia abajo. */
function PendantLamp({ z, shadows }: { z: number; shadows: boolean }) {
  const target = useMemo(() => new THREE.Object3D(), [])
  return (
    <group position={[0, CEILING - 0.55, z]}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.55, 6]} />
        <meshStandardMaterial color="#111" roughness={0.6} />
      </mesh>
      <mesh>
        <coneGeometry args={[0.26, 0.22, 32, 1, true]} />
        <meshStandardMaterial color="#20201c" metalness={0.85} roughness={0.32} side={THREE.DoubleSide} />
      </mesh>
      {/* Bombilla: más clara que el blanco para que el posprocesado la haga brillar. */}
      <mesh position={[0, -0.07, 0]}>
        <sphereGeometry args={[0.06, 20, 14]} />
        <meshBasicMaterial color={[5, 3.6, 2.2]} toneMapped={false} />
      </mesh>
      <primitive object={target} position={[0, -3, 0]} />
      <spotLight
        target={target}
        position={[0, -0.1, 0]}
        color="#ffcf94"
        intensity={28}
        angle={1.0}
        penumbra={0.75}
        distance={11}
        decay={1.6}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
    </group>
  )
}

/** Escaparate de la entrada: luz de día entrando por los cristales (al darse la vuelta). */
function Storefront({ z, wood }: { z: number; wood: THREE.Material }) {
  const panes = [-1.85, 1.85]
  return (
    <group position={[0, 0, z - 0.02]} rotation-y={Math.PI}>
      {panes.map((x) => (
        <group key={x} position={[x, 1.55, 0]}>
          <mesh>
            <planeGeometry args={[2.3, 1.9]} />
            <meshBasicMaterial color={[2.1, 2.05, 1.95]} toneMapped={false} />
          </mesh>
          {/* Marco y parteluces */}
          {[-1.17, 1.17].map((fx) => (
            <mesh key={fx} position={[fx, 0, 0.03]} material={wood}>
              <boxGeometry args={[0.08, 2.0, 0.08]} />
            </mesh>
          ))}
          {[-0.97, 0.97, 0].map((fy) => (
            <mesh key={fy} position={[0, fy, 0.03]} material={wood}>
              <boxGeometry args={[2.4, fy === 0 ? 0.04 : 0.08, 0.08]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Puerta acristalada */}
      <group position={[0, 1.15, 0]}>
        <mesh position={[0, 0.35, 0]}>
          <planeGeometry args={[0.95, 1.2]} />
          <meshBasicMaterial color={[1.9, 1.85, 1.75]} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.55, 0.01]} material={wood}>
          <boxGeometry args={[1.05, 0.65, 0.05]} />
        </mesh>
        <mesh position={[0.38, -0.1, 0.06]}>
          <boxGeometry args={[0.03, 0.22, 0.03]} />
          <meshStandardMaterial color="#c9a45c" metalness={0.9} roughness={0.3} />
        </mesh>
        {[-0.52, 0.52].map((fx) => (
          <mesh key={fx} position={[fx, 0, 0.03]} material={wood}>
            <boxGeometry args={[0.08, 2.35, 0.08]} />
          </mesh>
        ))}
      </group>
      {/* Luz fría de la calle entrando por el escaparate. */}
      <pointLight position={[0, 1.6, 0.8]} color="#dfe8ff" intensity={6} distance={7} decay={1.6} />
    </group>
  )
}

function Room({ units, quality }: { units: UnitLayout[]; quality: Quality }) {
  const surface = useSurface()
  const bounds = walkBounds(units)
  const backZ = backWallZ(units)
  const frontZ = bounds.maxZ + 0.6
  const length = frontZ - backZ
  const midZ = (frontZ + backZ) / 2
  const width = WALL_X * 2 + 0.4

  const floor = surface('wood_floor_worn', { repeat: [width / 1.8, length / 1.8], roughness: 1 })
  const sideWall = surface('beige_wall_001', { repeat: [length / 2.5, CEILING / 2.5], tint: '#c7a47c', normalScale: 0.6 })
  const endWall = surface('beige_wall_001', { repeat: [width / 2.5, CEILING / 2.5], tint: '#b8946d', normalScale: 0.6 })
  const ceiling = surface('plastered_wall', { repeat: [width / 3, length / 3], tint: '#6e5a48' })
  const beam = surface('dark_wood', { repeat: [3, 0.3], tint: '#7a5a40' })
  const trim = surface('dark_wood', { repeat: [length / 2, 0.1], tint: '#6a4a32' })

  const storeSign = useMemo(storeSignTexture, [])
  const lampZs = useMemo(() => {
    const zs: number[] = []
    for (let z = frontZ - 2; z > backZ + 1; z -= 4.2) zs.push(z)
    return zs
  }, [frontZ, backZ])
  const beamZs = useMemo(() => {
    const zs: number[] = []
    for (let z = frontZ - 1; z > backZ; z -= 2.1) zs.push(z)
    return zs
  }, [frontZ, backZ])

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, midZ]} material={floor} receiveShadow>
        <planeGeometry args={[width, length]} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, CEILING, midZ]} material={ceiling}>
        <planeGeometry args={[width, length]} />
      </mesh>
      {/* Vigas de madera en el techo */}
      {beamZs.map((z) => (
        <mesh key={z} position={[0, CEILING - 0.09, z]} material={beam} castShadow={false}>
          <boxGeometry args={[width, 0.18, 0.16]} />
        </mesh>
      ))}
      {/* Paredes laterales con zócalo y moldura */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * (WALL_X + 0.2), CEILING / 2, midZ]} rotation-y={(-side * Math.PI) / 2} material={sideWall} receiveShadow>
            <planeGeometry args={[length, CEILING]} />
          </mesh>
          <mesh position={[side * (WALL_X + 0.17), 0.07, midZ]} material={trim}>
            <boxGeometry args={[0.06, 0.14, length]} />
          </mesh>
          <mesh position={[side * (WALL_X + 0.16), CEILING - 0.05, midZ]} material={trim}>
            <boxGeometry args={[0.08, 0.1, length]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, CEILING / 2, backZ]} material={endWall} receiveShadow>
        <planeGeometry args={[width, CEILING]} />
      </mesh>
      <mesh position={[0, CEILING / 2, frontZ]} rotation-y={Math.PI} material={endWall}>
        <planeGeometry args={[width, CEILING]} />
      </mesh>
      <Storefront z={frontZ} wood={trim} />
      <mesh position={[0, 1.9, backZ + 0.02]}>
        <planeGeometry args={[3.6, 1.35]} />
        <meshStandardMaterial map={storeSign} roughness={0.7} />
      </mesh>
      {lampZs.map((z, i) => (
        // Sombras solo en una de cada tres lámparas: suficiente para el efecto, sin hundir el rendimiento.
        <PendantLamp key={z} z={z} shadows={quality === 'high' && i % 3 === 1} />
      ))}
    </group>
  )
}

// ---------------------------------------------------------------- muebles

function ShelfUnit({ unit, atlas, takenIds, onHover, onSelect }: { unit: UnitLayout; atlas: THREE.Texture | null } & Pick<SceneProps, 'onHover' | 'onSelect' | 'takenIds'>) {
  const surface = useSurface()
  const isCollection = unit.decade === COLLECTION_KEY
  // Con atlas: todas las portadas en una sola instancia. Sueltas solo las que no tienen recorte
  // (o todas, con su color de funda, mientras el atlas carga).
  const looseSlots = useMemo(() => (atlas ? unit.slots.filter((s) => !atlasUV(s.album.id)) : unit.slots), [atlas, unit.slots])

  const back = surface('dark_wood', { repeat: [UNIT_WIDTH / 1.6, 2.6 / 1.6], tint: '#8a6a52' })
  const wood = surface('dark_wood', { repeat: [0.4, 2.2] })
  const ledge = surface('dark_wood', { repeat: [UNIT_WIDTH / 1.4, 0.25] })

  const sign = useMemo(() => {
    if (isCollection) {
      const n = unit.slots.length
      return signTexture(unit.label, n === 0 ? 'Tus discos, aquí' : n === 1 ? '1 disco · Tu colección' : `${n} discos · Tu colección`)
    }
    const years = unit.yearTags.map((t) => t.year)
    const span = years.length ? `${Math.min(...years)}–${Math.max(...years)} · Top 10 Billboard` : ''
    return signTexture(unit.label, span)
  }, [unit, isCollection])
  const emptyCard = useMemo(
    () => (isCollection && unit.slots.length === 0 ? labelCardTexture('Tu colección está vacía', 'Registra tus vinilos en «Mi colección»') : null),
    [isCollection, unit.slots.length],
  )

  return (
    <group position={unit.center} rotation-y={unit.rotationY}>
      {/* Trasera, laterales, zócalo y cornisa de madera maciza. */}
      <mesh position={[0, 1.3, -0.03]} material={back} receiveShadow>
        <boxGeometry args={[UNIT_WIDTH + 0.3, 2.6, 0.06]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (UNIT_WIDTH / 2 + 0.15), 1.32, 0.12]} material={wood} castShadow receiveShadow>
          <boxGeometry args={[0.07, 2.64, 0.36]} />
        </mesh>
      ))}
      <mesh position={[0, 0.07, 0.14]} material={ledge} castShadow receiveShadow>
        <boxGeometry args={[UNIT_WIDTH + 0.24, 0.14, 0.32]} />
      </mesh>
      <mesh position={[0, 2.64, 0.13]} material={ledge} castShadow>
        <boxGeometry args={[UNIT_WIDTH + 0.44, 0.08, 0.4]} />
      </mesh>
      {ROW_Y.map((y) => (
        <group key={y} position={[0, y - COVER_SIZE / 2 - 0.02, 0.1]}>
          <mesh material={ledge} castShadow receiveShadow>
            <boxGeometry args={[UNIT_WIDTH + 0.24, 0.03, 0.3]} />
          </mesh>
          {/* Listón delantero que sujeta los discos */}
          <mesh position={[0, 0.025, 0.14]} material={ledge} castShadow>
            <boxGeometry args={[UNIT_WIDTH + 0.24, 0.035, 0.02]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 2.95, 0.04]} castShadow>
        <boxGeometry args={[2.66, 0.71, 0.04]} />
        <meshStandardMaterial color="#2e1d10" roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.95, 0.061]}>
        <planeGeometry args={[2.6, 0.65]} />
        <meshStandardMaterial map={sign} roughness={0.75} />
      </mesh>
      {unit.yearTags.map((tag) => (
        <YearTag key={tag.year} year={tag.year} x={tag.x} y={tag.y - COVER_SIZE / 2 - 0.035} />
      ))}
      {atlas && <CoverInstances slots={unit.slots} atlas={atlas} takenIds={takenIds} onHover={onHover} onSelect={onSelect} />}
      {looseSlots.map((slot) => (
        <Cover key={slot.album.id} slot={slot} remote={isCollection} hidden={takenIds.includes(slot.album.id)} onHover={onHover} onSelect={onSelect} />
      ))}
      {emptyCard && (
        <mesh position={[0, ROW_Y[2], 0.1]} rotation-x={-0.1}>
          <planeGeometry args={[0.9, 0.28]} />
          <meshStandardMaterial map={emptyCard} roughness={0.9} />
        </mesh>
      )}
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
  hidden: boolean
  /** Sin hueco en los atlas (discos de la colección): portada descargada del Cover Art Archive. */
  remote?: boolean
}

/** Portada pequeña del Cover Art Archive como textura; null mientras carga o si no hay. */
function useRemoteCover(album: Album, enabled: boolean) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  useEffect(() => {
    const url = enabled ? coverUrlFor(album, 250) : undefined
    if (!url) return
    let alive = true
    let loaded: THREE.Texture | null = null
    loadRemoteTexture(url).then((t) => {
      loaded = t
      if (alive) setTexture(t)
      else t?.dispose()
    })
    return () => {
      alive = false
      loaded?.dispose()
      setTexture(null)
    }
  }, [album, enabled])
  return texture
}

/** Funda suelta: discos sin portada (tipográfica) o, mientras carga el atlas, color de funda. */
function Cover({ slot, hidden, remote = false, onHover, onSelect }: CoverProps) {
  const { album } = slot
  const [hovered, setHovered] = useState(false)
  const hasCover = useMemo(() => atlasUV(album.id) !== null, [album.id])
  const photo = useRemoteCover(album, remote && !hasCover)
  const placeholder = useMemo(() => (hasCover ? null : placeholderTexture(album)), [hasCover, album])

  return (
    <mesh
      visible={!hidden}
      castShadow
      geometry={plainCoverGeometry}
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
      {photo ? (
        <meshStandardMaterial key="photo" map={photo} roughness={0.38} envMapIntensity={0.8} />
      ) : placeholder ? (
        <meshStandardMaterial key="placeholder" map={placeholder} roughness={0.42} />
      ) : (
        // Mientras llega el atlas: color de funda.
        <meshStandardMaterial color={sleeveFor(album).bg} roughness={0.55} />
      )}
    </mesh>
  )
}
