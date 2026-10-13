/**
 * Tienda 3D en primera persona, a pantalla completa. Empieza con una pantalla de
 * entrada (como un juego): la tienda se ve detrás, se reponen las baldas (atlas de
 * portadas) y al pulsar «Entrar» la cámara cruza la puerta.
 */
import { Canvas } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Link } from 'react-router-dom'
import type * as THREE from 'three'
import { useAlbumDetail } from '@/components/album/albumDetailContext'
import { usePreviewPlayer } from '@/components/player/previewPlayerContext'
import type { Album } from '@/types/music'
import { cn } from '@/utils/cn'
import { loadAtlas } from './atlas'
import { buildStoreLayout, ENTER, START, UNIT_WIDTH, WALL_X, type DecadeInput, type UnitLayout } from './layout'
import { createNavState, LOOK_SENSITIVITY, MAX_PITCH, NAV_KEYS } from './navigation'
import { StoreScene } from './StoreScene'
import { fontsReady } from './textures'

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

export default function StoreExperience({ decades }: { decades: DecadeInput[] }) {
  const { openAlbum } = useAlbumDetail()
  const { state: player } = usePreviewPlayer()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [entered, setEntered] = useState(readEntered)
  const nav = useRef(createNavState(!entered)).current
  const units = useMemo(() => buildStoreLayout(decades), [decades])
  const { atlases, loaded } = useAtlases(units)
  const [hovered, setHovered] = useState<Album | null>(null)
  const [fonts, setFonts] = useState(false)
  const [current, setCurrent] = useState<string | null>(null)
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const drag = useRef<{ x: number; y: number; id: number } | null>(null)
  const playerOpen = player.album !== null && player.status !== 'idle'

  useEffect(() => {
    fontsReady().then(() => setFonts(true))
  }, [])

  // Teclado: solo cuando la tienda tiene el foco.
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const down = (e: KeyboardEvent) => {
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
          dpr={[1, 1.75]}
          camera={{ fov: FOV, near: 0.05, far: 60, position: [nav.x, nav.y, nav.z] }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          onPointerMissed={() => setHovered(null)}
        >
          <StoreScene
            units={units}
            atlases={atlases}
            nav={nav}
            reducedMotion={reducedMotion}
            onHover={entered ? setHovered : () => undefined}
            onSelect={entered ? openAlbum : () => undefined}
          />
        </Canvas>
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
          <button type="button" onClick={toggleFullscreen} className={cn(chip, chipIdle, 'hidden sm:block')}>
            Pantalla completa
          </button>
        </nav>
      </div>

      {entered && hovered && (
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
          entered ? 'opacity-100' : 'pointer-events-none opacity-0',
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
