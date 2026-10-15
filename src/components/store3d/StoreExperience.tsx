/**
 * Tienda 3D en primera persona, a pantalla completa. Empieza con una pantalla de
 * entrada (como un juego): la tienda se ve detrás, se reponen las baldas (atlas de
 * portadas) y al pulsar «Entrar» la cámara cruza la puerta.
 */
import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { useAlbumDetail } from '@/components/album/albumDetailContext'
import { useFavorites } from '@/components/favorites/favoritesContext'
import { usePreviewPlayer } from '@/components/player/previewPlayerContext'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { formatLength, getAlbumBack, type AlbumBack } from '@/services/albumBack'
import type { Album } from '@/types/music'
import { cn } from '@/utils/cn'
import { loadAtlas } from './atlas'
import { buildDecorLayout } from './decorLayout'
import { buildStoreLayout, ENTER, START, UNIT_WIDTH, WALL_X, type DecadeInput, type UnitLayout } from './layout'
import { createNavState, LOOK_SENSITIVITY, MAX_PITCH, NAV_KEYS } from './navigation'
import { HeldPanel } from './HeldPanel'
import { HeldRecord, type HeldState, type HoldControl } from './HeldRecord'
import { AdaptivePerformance } from './AdaptivePerformance'
import { debugEnabled, StatsProbe, type FrameStats } from './DebugStats'
import { CameraEffects } from './Lighting'
import { detectQuality, hasSavedQuality, saveQuality, type Quality } from './quality'
import { StoreScene } from './StoreScene'
import { fontsReady, type BackData } from './textures'

const FOV = 62
/** No más lejos que el borde de los muebles de enfrente. */
const MAX_VIEW_DISTANCE = WALL_X * 2 - 1.2
const ENTERED_KEY = 'vinylclub:entered'

/** Si ya se entró en esta sesión, al volver se salta la pantalla de inicio. */
function readEntered(): boolean {
  try {
    return sessionStorage.getItem(ENTERED_KEY) === '1'
  } catch {
    return false
  }
}

/** Carga los 8 atlas en el orden del pasillo y avisa del progreso. */
function useAtlases(units: UnitLayout[]) {
  const [atlases, setAtlases] = useState<Record<string, THREE.Texture | null>>({})
  useEffect(() => {
    let cancelled = false
    for (const unit of units) {
      loadAtlas(unit.decade).then((texture) => {
        if (!cancelled) setAtlases((prev) => ({ ...prev, [unit.decade]: texture }))
      })
    }
    return () => {
      cancelled = true
    }
  }, [units])
  return { atlases, loaded: Object.keys(atlases).length }
}

/** Década (clave del atlas) en la que está colocado un disco. */
const decadeKey = (album: Album) => `${Math.floor((album.charts?.[0]?.year ?? 0) / 10) * 10}s`

/** Lo que se pinta en el reverso a partir de los datos reales de la edición. */
function toBackData(album: Album, back: AlbumBack | null | undefined): BackData {
  if (album.source !== 'musicbrainz' || !back) {
    return { tracks: [], footer: ['Lista anual de Billboard'], note: 'Sin datos de la edición en MusicBrainz' }
  }
  const edition = [back.labels.join(' / '), back.catalogNumbers[0]].filter(Boolean).join(' · ')
  const details = [back.date, back.country, back.format].filter(Boolean).join(' · ')
  return {
    tracks: back.tracks.map((t) => ({ number: t.number, title: t.title, length: formatLength(t.length) })),
    footer: [edition, details].filter(Boolean),
    note: 'Reverso compuesto con datos de MusicBrainz',
  }
}

export default function StoreExperience({ decades }: { decades: DecadeInput[] }) {
  const { openAlbum } = useAlbumDetail()
  const { state: player, toggle: togglePreview, audio } = usePreviewPlayer()
  const { albums: favorites } = useFavorites()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [entered, setEntered] = useState(readEntered)
  const nav = useRef(createNavState(!entered)).current
  const units = useMemo(() => buildStoreLayout(decades), [decades])
  const decor = useMemo(
    () => buildDecorLayout(units, Object.fromEntries(decades.map((d) => [d.decade, d.albums.map((a) => a.album)]))),
    [units, decades],
  )
  const numberOnes = useMemo(() => decor.crates.flatMap((c) => c.albums), [decor])
  const [hint, setHint] = useState<string | null>(null)
  const { atlases, loaded } = useAtlases(units)
  const [hovered, setHovered] = useState<Album | null>(null)
  const [quality, setQuality] = useState<Quality>(detectQuality)
  const [debug] = useState(debugEnabled)
  const [stats, setStats] = useState<FrameStats | null>(null)
  // Calidad elegida a mano: se respeta. Detectada sola: puede bajar si el equipo no llega.
  const [autoQuality, setAutoQuality] = useState(() => !hasSavedQuality())
  const switchQuality = () => {
    const next = quality === 'high' ? 'low' : 'high'
    saveQuality(next)
    setAutoQuality(false)
    setQuality(next)
  }
  const [fonts, setFonts] = useState(false)
  const [current, setCurrent] = useState<string | null>(null)
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const drag = useRef<{ x: number; y: number; id: number } | null>(null)
  const playerOpen = player.album !== null && player.status !== 'idle'

  // ---------- disco en la mano
  const [held, setHeld] = useState<HeldState | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [flipped, setFlipped] = useState(false)
  // Cuánto tapa la cartela (fracción de la altura): el disco se coloca encima.
  const [coveredBottom, setCoveredBottom] = useState(0.45)
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const panel = panelRef.current
    const wrapper = wrapperRef.current
    if (!panel || !wrapper) return
    const measure = () => setCoveredBottom(Math.min(0.7, panel.offsetHeight / Math.max(1, wrapper.clientHeight)))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(panel)
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [held, leaving])
  const control = useRef<HoldControl>({ rotY: 0, rotX: 0, flipped: false }).current
  const back = useAsyncResource(held?.album.source === 'musicbrainz' ? `back|${held.album.id}` : null, (signal) =>
    getAlbumBack(held!.album, signal),
  )
  const backData = useMemo(() => {
    if (!held) return null
    if (held.album.source === 'musicbrainz' && back.status === 'loading') return null
    return toBackData(held.album, back.status === 'success' ? back.data : null)
  }, [held, back])
  const backImage = back.status === 'success' ? back.data?.backImage : undefined
  const backNote =
    held?.album.source !== 'musicbrainz'
      ? 'Reverso sin datos: disco no localizado en MusicBrainz'
      : backImage
        ? 'Reverso: contraportada original · Cover Art Archive'
        : back.status === 'error'
          ? 'No se pudo cargar el reverso'
          : 'Reverso compuesto con datos de MusicBrainz'

  const pickUp = useCallback(
    (album: Album, object: THREE.Object3D) => {
      if (held) return
      control.rotY = 0
      control.rotX = 0
      control.flipped = false
      setFlipped(false)
      nav.locked = true
      nav.fly = null
      nav.keys.clear()
      setHovered(null)
      setHeld({
        album,
        fromPosition: object.getWorldPosition(new THREE.Vector3()),
        fromQuaternion: object.getWorldQuaternion(new THREE.Quaternion()),
      })
      wrapperRef.current?.focus({ preventScroll: true })
    },
    [held, control, nav],
  )
  const putBack = useCallback(() => {
    if (!held) return
    control.rotY = 0
    control.rotX = 0
    control.flipped = false
    setFlipped(false)
    setLeaving(true)
  }, [held, control])
  const flip = useCallback(() => {
    control.flipped = !control.flipped
    control.rotY = 0
    control.rotX = 0
    setFlipped(control.flipped)
  }, [control])
  // ---------- tocadiscos y gramola
  const [turntableRecord, setTurntableRecord] = useState<Album | null>(null)
  const [toTurntable, setToTurntable] = useState<{ position: THREE.Vector3; quaternion: THREE.Quaternion } | null>(null)
  const [jukeboxPick, setJukeboxPick] = useState<Album | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4500)
    return () => clearTimeout(timer)
  }, [toast])

  const isPlaying = (album: Album | null) => !!album && player.album?.id === album.id && player.status === 'playing'

  /** Lleva el disco de la mano al mostrador y lo pone a sonar en el tocadiscos. */
  const placeOnTurntable = useCallback(() => {
    if (!held || leaving) return
    control.rotY = 0
    control.rotX = 0
    control.flipped = false
    setFlipped(false)
    const view = decor.counterView
    nav.fly = { x: view.x, y: view.y, z: view.z, yaw: view.yaw, pitch: view.pitch }
    const { x, y, z } = decor.turntable
    const pose = {
      position: new THREE.Vector3(x - 0.04, y + 0.012, z),
      // Tumbado sobre el plato, con la portada hacia arriba.
      quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)),
    }
    // Primero se camina hasta el mostrador con el disco en la mano; luego se suelta en el plato.
    setTimeout(() => {
      setToTurntable(pose)
      setLeaving(true)
    }, reducedMotion ? 0 : 1300)
  }, [held, leaving, control, decor, nav, reducedMotion])

  const onLeft = useCallback(() => {
    if (toTurntable && held) {
      setTurntableRecord(held.album)
      if (!isPlaying(held.album)) togglePreview(held.album)
    }
    setToTurntable(null)
    setHeld(null)
    setLeaving(false)
    nav.locked = false
  }, [nav, toTurntable, held, togglePreview, player])

  const onTurntable = useCallback(() => {
    if (held) return placeOnTurntable()
    if (turntableRecord) return togglePreview(turntableRecord)
    setToast('Coge un disco de la balda y ponlo en el tocadiscos')
  }, [held, placeOnTurntable, turntableRecord, togglePreview])

  // Lo que muestra la pantalla de la gramola: su elección mientras suena, o el selector en reposo.
  const jukeboxTitles = useMemo(() => numberOnes.slice(-12).map((a) => a.title), [numberOnes])
  const jukeboxScreen = useMemo(() => {
    const own = jukeboxPick && player.album?.id === jukeboxPick.id
    const status = own ? player.status : 'idle'
    return {
      status: status === 'error' ? ('unavailable' as const) : status,
      title: own ? (player.preview?.trackName ?? jukeboxPick.title) : undefined,
      artist: own ? jukeboxPick.artist : undefined,
      titles: jukeboxTitles,
    }
  }, [jukeboxPick, player, jukeboxTitles])

  const onJukebox = useCallback(() => {
    const options = numberOnes.filter((a) => a.id !== jukeboxPick?.id)
    const pick = options[Math.floor(Math.random() * options.length)]
    if (!pick) return
    setJukeboxPick(pick)
    togglePreview(pick)
    setToast(`La gramola elige «${pick.title}» · ${pick.artist}`)
  }, [numberOnes, jukeboxPick, togglePreview])

  // Los manejadores de teclado se registran una vez: leen las acciones actuales por referencia.
  const putBackRef = useRef(putBack)
  const flipRef = useRef(flip)
  putBackRef.current = putBack
  flipRef.current = flip

  useEffect(() => {
    fontsReady().then(() => setFonts(true))
  }, [])

  // Teclado: solo cuando la tienda tiene el foco.
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const down = (e: KeyboardEvent) => {
      if (nav.locked) {
        if (e.code === 'Escape') putBackRef.current()
        if (e.code === 'KeyF' || e.code === 'Space') {
          e.preventDefault()
          flipRef.current()
        }
        return
      }
      if (!NAV_KEYS.has(e.code) || nav.intro) return
      e.preventDefault()
      nav.fly = null
      nav.keys.add(e.code)
    }
    const up = (e: KeyboardEvent) => nav.keys.delete(e.code)
    const blur = () => nav.keys.clear()
    el.addEventListener('keydown', down)
    el.addEventListener('keyup', up)
    el.addEventListener('blur', blur)
    return () => {
      el.removeEventListener('keydown', down)
      el.removeEventListener('keyup', up)
      el.removeEventListener('blur', blur)
    }
  }, [nav])

  // Rueda: avanzar y retroceder por el pasillo.
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      if (nav.intro) return
      nav.fly = null
      const step = Math.max(-0.6, Math.min(0.6, -e.deltaY * 0.004))
      nav.x += -Math.sin(nav.yaw) * step
      nav.z += -Math.cos(nav.yaw) * step
    }
    el.addEventListener('wheel', wheel, { passive: false })
    return () => el.removeEventListener('wheel', wheel)
  }, [nav])

  const enter = () => {
    nav.intro = false
    const [x, y, z] = ENTER.position
    nav.fly = { x, y, z, yaw: ENTER.yaw }
    setEntered(true)
    try {
      sessionStorage.setItem(ENTERED_KEY, '1')
    } catch {
      // Sin almacenamiento: la próxima vez se verá de nuevo la entrada.
    }
    wrapperRef.current?.focus({ preventScroll: true })
  }

  const onPointerDown = (e: ReactPointerEvent) => {
    if (!entered || (e.target as HTMLElement).closest('[data-hud]')) return
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
    wrapperRef.current?.focus({ preventScroll: true })
  }
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    if (held) {
      // Con un disco en la mano, arrastrar lo gira.
      control.rotY += (e.clientX - d.x) * 0.009
      control.rotX = Math.max(-0.7, Math.min(0.7, control.rotX + (e.clientY - d.y) * 0.009))
      d.x = e.clientX
      d.y = e.clientY
      return
    }
    nav.fly = null
    nav.yaw += (e.clientX - d.x) * LOOK_SENSITIVITY
    nav.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, nav.pitch + (e.clientY - d.y) * LOOK_SENSITIVITY))
    d.x = e.clientX
    d.y = e.clientY
  }
  const endDrag = () => {
    drag.current = null
  }

  /** Distancia para que el mueble quepa a lo ancho, sin salir del pasillo. */
  const viewX = useCallback((unit: UnitLayout) => {
    const el = wrapperRef.current
    const aspect = el ? el.clientWidth / Math.max(1, el.clientHeight) : 16 / 9
    const halfHFov = Math.atan(Math.tan((FOV * Math.PI) / 360) * aspect)
    const distance = Math.min(MAX_VIEW_DISTANCE, Math.max(2.6, (UNIT_WIDTH / 2 + 0.4) / Math.tan(halfHFov)))
    return unit.center[0] + (unit.side === 'left' ? distance : -distance)
  }, [])

  const goTo = useCallback(
    (decade: string | null) => {
      setCurrent(decade)
      nav.intro = false
      if (decade === null) {
        const [x, y, z] = START.position
        nav.fly = { x, y, z, yaw: START.yaw }
        return
      }
      const unit = units.find((u) => u.decade === decade)
      if (!unit) return
      const [, y, z] = unit.viewpoint.position
      nav.fly = { x: viewX(unit), y, z, yaw: unit.viewpoint.yaw }
      wrapperRef.current?.focus({ preventScroll: true })
    },
    [nav, units, viewX],
  )

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void wrapperRef.current?.requestFullscreen?.()
  }

  const walkButton = (direction: 1 | -1, label: string, symbol: string) => (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault()
        nav.fly = null
        nav.walk = direction
      }}
      onPointerUp={() => (nav.walk = 0)}
      onPointerLeave={() => (nav.walk = 0)}
      onPointerCancel={() => (nav.walk = 0)}
      className="grid size-12 place-items-center rounded-full bg-[#f3e4c3]/90 text-xl text-[#1b130c] shadow-lg active:bg-signal active:text-paper"
    >
      {symbol}
    </button>
  )

  const chip = 'label-mono rounded px-3 py-2 whitespace-nowrap backdrop-blur-sm transition-colors'
  const chipIdle = 'bg-[#1b130c]/75 text-[#f3e4c3] hover:bg-[#3e2716]'
  const total = units.length

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      role="application"
      aria-roledescription="tienda 3D"
      aria-label="Tienda de discos en 3D. Usa W, A, S y D o las flechas para moverte, arrastra para mirar alrededor y pulsa una portada para abrir su ficha."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="relative h-full w-full touch-none overflow-hidden bg-[#1b130c] select-none focus-visible:outline-none"
    >
      {fonts && (
        <Canvas
          // Cambiar de calidad reconstruye el lienzo (sombras y posprocesado se fijan al crearlo).
          key={quality}
          shadows={quality === 'high' ? 'soft' : false}
          dpr={quality === 'high' ? [1, 1.5] : [1, 1.25]}
          camera={{ fov: FOV, near: 0.05, far: 60, position: [nav.x, nav.y, nav.z] }}
          gl={{ antialias: quality !== 'high', powerPreference: 'high-performance' }}
          onPointerMissed={() => setHovered(null)}
        >
          <Suspense fallback={null}>
          <StoreScene
            quality={quality}
            units={units}
            atlases={atlases}
            nav={nav}
            reducedMotion={reducedMotion}
            onHover={entered && !held ? setHovered : () => undefined}
            onSelect={entered ? pickUp : () => undefined}
            takenIds={[held?.album.id, turntableRecord?.id].filter((id): id is string => !!id)}
            decor={decor}
            turntableRecord={turntableRecord}
            turntablePlaying={isPlaying(turntableRecord)}
            holding={!!held}
            jukeboxScreen={jukeboxScreen}
            audio={audio}
            jukeboxGlowing={isPlaying(jukeboxPick)}
            onTurntable={entered ? onTurntable : () => undefined}
            onJukebox={entered && !held ? onJukebox : () => undefined}
            onHint={entered ? setHint : () => undefined}
          />
          {held && (
            <HeldRecord
              key={held.album.id}
              held={held}
              leaving={leaving}
              control={control}
              atlas={atlases[decadeKey(held.album)] ?? null}
              back={backData}
              backImage={backImage}
              playing={player.album?.id === held.album.id && player.status === 'playing'}
              reducedMotion={reducedMotion}
              coveredBottom={coveredBottom}
              toPose={toTurntable ?? undefined}
              onLeft={onLeft}
            />
          )}
          <CameraEffects quality={quality} />
          <AdaptivePerformance onTooSlow={autoQuality && quality === 'high' ? () => setQuality('low') : undefined} />
          {debug && <StatsProbe onStats={setStats} />}
          </Suspense>
        </Canvas>
      )}

      {debug && stats && (
        <pre className="pointer-events-none absolute top-16 left-3 z-40 rounded bg-black/75 p-2 font-mono text-[11px] leading-tight text-lime-300">
          {`${stats.fps} fps · peor ${stats.frameMs} ms\n${stats.calls} dibujos · ${(stats.triangles / 1000).toFixed(0)}k triáng.\n${stats.lights} luces · ${stats.programs} shaders · ${stats.textures} texturas\ncalidad ${quality}`}
        </pre>
      )}

      {/* ---------- Pantalla de entrada ---------- */}
      <div
        aria-hidden={entered}
        className={cn(
          'absolute inset-0 z-20 grid place-items-center bg-[#1b130c]/55 p-6 backdrop-blur-[3px] transition-opacity duration-700',
          entered ? 'pointer-events-none opacity-0' : 'opacity-100',
        )}
      >
        <div className="w-full max-w-lg text-center text-[#f3e4c3]">
          <div className="rounded-sm border-2 border-[#e8c98f] bg-[#3e2716]/90 px-6 py-8 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] sm:px-10">
            <span aria-hidden className="vinyl vinyl-spin mx-auto block size-14" />
            <h1 className="mt-5 font-display text-5xl font-semibold tracking-tight italic sm:text-6xl">Vinyl Club</h1>
            <p className="label-mono mt-3 text-[#e8c98f]">Los más vendidos de cada año · 1956–2025</p>

            <div className="mt-7" role="status" aria-live="polite">
              <div className="h-1.5 overflow-hidden rounded-full bg-[#1b130c]">
                <div
                  className="h-full bg-signal transition-[width] duration-500"
                  style={{ width: `${(loaded / Math.max(1, total)) * 100}%` }}
                />
              </div>
              <p className="label-mono mt-2 text-[#f3e4c3]/70">
                {loaded < total ? `Reponiendo las baldas… ${loaded}/${total} décadas` : 'Tienda abierta'}
              </p>
            </div>

            <button
              type="button"
              onClick={enter}
              tabIndex={entered ? -1 : 0}
              className="mt-7 w-full rounded-sm bg-signal px-6 py-4 font-display text-xl font-semibold text-paper shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-signal-deep focus-visible:outline-[#f3e4c3] active:translate-y-0"
            >
              Entrar en la tienda
            </button>
            <p className="label-mono mt-4 text-[#f3e4c3]/60">
              <span className="hidden sm:inline">WASD o flechas para caminar · arrastra para mirar</span>
              <span className="sm:hidden">Arrastra para mirar · ▲ ▼ para caminar</span>
            </p>
          </div>
          <Link
            to="/estanterias"
            tabIndex={entered ? -1 : 0}
            className="label-mono mt-5 inline-block text-[#f3e4c3]/80 underline decoration-[#f3e4c3]/30 underline-offset-4 hover:text-[#f3e4c3]"
          >
            o ver las estanterías en lista
          </Link>
        </div>
      </div>

      {/* ---------- Cartela del disco en la mano ---------- */}
      {held && !leaving && (
        <div ref={panelRef} className={cn('pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3 sm:p-4', playerOpen && 'pb-20 sm:pb-20')}>
          <HeldPanel
            album={held.album}
            flipped={flipped}
            backNote={backNote}
            onFlip={flip}
            onReturn={putBack}
            onTurntable={placeOnTurntable}
            onDetails={() => openAlbum(held.album)}
          />
        </div>
      )}

      {/* ---------- HUD dentro de la tienda ---------- */}
      <div
        data-hud
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 p-3 transition-opacity duration-500 sm:p-4',
          entered ? 'opacity-100' : 'opacity-0',
        )}
      >
        <Link
          to="/"
          onClick={() => goTo(null)}
          className="pointer-events-auto flex items-center gap-2 rounded bg-[#1b130c]/70 px-3 py-2 text-[#f3e4c3] backdrop-blur-sm"
        >
          <span aria-hidden className="vinyl block size-5" />
          <span className="font-display text-lg leading-none font-semibold">
            Vinyl <em className="font-normal">Club</em>
          </span>
        </Link>
        <nav aria-label="Tienda" className="pointer-events-auto flex gap-1.5">
          <Link to="/buscar" className={cn(chip, chipIdle)}>
            Buscar
          </Link>
          <Link to="/estanterias" className={cn(chip, chipIdle)}>
            Lista
          </Link>
          <Link to="/favoritos" className={cn(chip, chipIdle)}>
            <span aria-hidden className="text-[#f2b01e]">★</span> Favoritos
            {favorites.length > 0 && <span className="ml-1 rounded-full bg-signal px-1.5 text-paper">{favorites.length}</span>}
          </Link>
          <button
            type="button"
            onClick={switchQuality}
            className={cn(chip, chipIdle, 'hidden sm:block')}
            title="Alta: texturas con relieve, sombras y luces que brillan. Ligera: más fluida en equipos modestos."
          >
            Calidad: {quality === 'high' ? 'alta' : 'ligera'}
          </button>
          <button type="button" onClick={toggleFullscreen} className={cn(chip, chipIdle, 'hidden sm:block')}>
            Pantalla completa
          </button>
        </nav>
      </div>

      {entered && !held && !hovered && hint && (
        <div
          data-hud
          aria-live="polite"
          className="label-mono pointer-events-none absolute top-20 left-1/2 z-10 max-w-[80%] -translate-x-1/2 rounded bg-[#1b130c]/85 px-4 py-2 text-center text-[#f3e4c3] shadow-xl"
        >
          {hint}
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="pointer-events-none absolute top-32 left-1/2 z-30 max-w-[86%] -translate-x-1/2 animate-[bar-in_320ms_var(--ease-out-soft)] rounded-sm border-2 border-[#e8c98f] bg-[#3e2716]/95 px-5 py-3 text-center font-display text-lg text-[#f3e4c3] italic shadow-2xl"
        >
          {toast}
        </div>
      )}

      {entered && !held && hovered && (
        <div
          data-hud
          aria-live="polite"
          className="pointer-events-none absolute top-20 left-1/2 z-10 max-w-[80%] -translate-x-1/2 rounded bg-paper px-4 py-2 text-center text-ink shadow-xl"
        >
          <p className="truncate font-display text-lg leading-tight font-medium">{hovered.title}</p>
          <p className="truncate text-sm text-ink-soft">
            {hovered.artist}
            {hovered.charts?.[0] && ` · nº ${hovered.charts[0].rank} en ${hovered.charts[0].year}`}
          </p>
        </div>
      )}

      <div
        data-hud
        className={cn(
          'absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-3 p-3 transition-[opacity,padding] duration-500 sm:p-4',
          entered && !held ? 'opacity-100' : 'pointer-events-none opacity-0',
          // El reproductor de demos ocupa el borde inferior: el HUD sube por encima.
          playerOpen && 'pb-20 sm:pb-20',
        )}
      >
        <nav aria-label="Ir a una década" className="min-w-0 flex-1">
          <ul className="no-scrollbar flex gap-1.5 overflow-x-auto">
            <li>
              <button
                type="button"
                onClick={() => goTo(null)}
                className={cn(chip, current === null ? 'bg-signal text-paper' : chipIdle)}
              >
                Entrada
              </button>
            </li>
            {units.map((unit) => (
              <li key={unit.decade}>
                <button
                  type="button"
                  onClick={() => goTo(unit.decade)}
                  aria-current={current === unit.decade ? 'location' : undefined}
                  className={cn(chip, current === unit.decade ? 'bg-signal text-paper' : chipIdle)}
                >
                  {unit.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex shrink-0 flex-col gap-2 [@media(hover:hover)]:hidden">
          {walkButton(1, 'Caminar hacia delante', '▲')}
          {walkButton(-1, 'Caminar hacia atrás', '▼')}
        </div>
      </div>
    </div>
  )
}
