/**
 * Tienda 3D en primera persona. Se carga de forma diferida (three.js es pesado)
 * desde `Store3D.tsx`; la vista de estanterías sigue disponible debajo.
 */
import { Canvas } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useAlbumDetail } from '@/components/album/albumDetailContext'
import type { Album } from '@/types/music'
import { cn } from '@/utils/cn'
import { buildStoreLayout, START, UNIT_WIDTH, WALL_X, type DecadeInput } from './layout'
import { createNavState, LOOK_SENSITIVITY, MAX_PITCH, NAV_KEYS } from './navigation'
import { StoreScene } from './StoreScene'
import { fontsReady } from './textures'

const FOV = 62
/** No más lejos que el borde de los muebles de enfrente. */
const MAX_VIEW_DISTANCE = WALL_X * 2 - 1.2

export default function StoreExperience({ decades }: { decades: DecadeInput[] }) {
  const { openAlbum } = useAlbumDetail()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const nav = useRef(createNavState()).current
  const units = useMemo(() => buildStoreLayout(decades), [decades])
  const [hovered, setHovered] = useState<Album | null>(null)
  const [visible, setVisible] = useState(true)
  const [fonts, setFonts] = useState(false)
  const [current, setCurrent] = useState<string | null>(null)
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const drag = useRef<{ x: number; y: number; id: number } | null>(null)

  useEffect(() => {
    fontsReady().then(() => setFonts(true))
  }, [])

  // Fuera de pantalla no se renderiza: ahorra batería y GPU.
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setVisible(!!entry?.isIntersecting), { threshold: 0.05 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Teclado: solo cuando la tienda tiene el foco, para no interferir con el resto de la página.
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const down = (e: KeyboardEvent) => {
      if (!NAV_KEYS.has(e.code)) return
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

  // Rueda: avanzar y retroceder por el pasillo (sin desplazar la página).
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      nav.fly = null
      const step = Math.max(-0.6, Math.min(0.6, -e.deltaY * 0.004))
      nav.x += -Math.sin(nav.yaw) * step
      nav.z += -Math.cos(nav.yaw) * step
    }
    el.addEventListener('wheel', wheel, { passive: false })
    return () => el.removeEventListener('wheel', wheel)
  }, [nav])

  const onPointerDown = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-hud]')) return
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

  /**
   * Distancia para que el mueble quepa a lo ancho según la proporción de la pantalla,
   * sin salir del pasillo (en móvil vertical se ve una parte y se camina de lado).
   */
  const viewX = useCallback((unit: (typeof units)[number]) => {
    const el = wrapperRef.current
    const aspect = el ? el.clientWidth / Math.max(1, el.clientHeight) : 16 / 9
    const halfHFov = Math.atan(Math.tan((FOV * Math.PI) / 360) * aspect)
    const distance = Math.min(MAX_VIEW_DISTANCE, Math.max(2.6, (UNIT_WIDTH / 2 + 0.4) / Math.tan(halfHFov)))
    return unit.center[0] + (unit.side === 'left' ? distance : -distance)
  }, [])

  const goTo = useCallback(
    (decade: string | null) => {
      setCurrent(decade)
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
      className="grid size-12 place-items-center rounded-full bg-paper/90 text-xl text-ink shadow-lg active:bg-signal active:text-paper"
    >
      {symbol}
    </button>
  )

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
      className="relative h-[min(78svh,760px)] min-h-[440px] touch-none overflow-hidden bg-[#1b130c] select-none focus-visible:outline-offset-0 [&:fullscreen]:h-full"
    >
      {fonts && (
        <Canvas
          frameloop={visible ? 'always' : 'never'}
          dpr={[1, 1.75]}
          camera={{ fov: FOV, near: 0.05, far: 60, position: [...START.position] }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          onPointerMissed={() => setHovered(null)}
        >
          <StoreScene units={units} nav={nav} reducedMotion={reducedMotion} onHover={setHovered} onSelect={openAlbum} />
        </Canvas>
      )}

      {/* HUD */}
      <div data-hud className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-4">
        <p className="label-mono max-w-xs rounded bg-[#1b130c]/70 px-3 py-2 text-[#f3e4c3]/90 backdrop-blur-sm">
          <span className="hidden sm:inline">WASD / flechas para caminar · arrastra para mirar · rueda para avanzar</span>
          <span className="sm:hidden">Arrastra para mirar · usa ▲ ▼ para caminar</span>
        </p>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="label-mono pointer-events-auto rounded bg-[#1b130c]/70 px-3 py-2 text-[#f3e4c3] backdrop-blur-sm hover:bg-signal"
        >
          Pantalla completa
        </button>
      </div>

      {hovered && (
        <div
          data-hud
          aria-live="polite"
          className="pointer-events-none absolute top-16 left-1/2 max-w-[80%] -translate-x-1/2 rounded bg-paper px-4 py-2 text-center text-ink shadow-xl"
        >
          <p className="truncate font-display text-lg leading-tight font-medium">{hovered.title}</p>
          <p className="truncate text-sm text-ink-soft">
            {hovered.artist}
            {hovered.charts?.[0] && ` · nº ${hovered.charts[0].rank} en ${hovered.charts[0].year}`}
          </p>
        </div>
      )}

      <div data-hud className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3 sm:p-4">
        <nav aria-label="Ir a una década" className="min-w-0 flex-1">
          <ul className="no-scrollbar flex gap-1.5 overflow-x-auto">
            <li>
              <button
                type="button"
                onClick={() => goTo(null)}
                className={cn(
                  'label-mono rounded px-3 py-2 whitespace-nowrap backdrop-blur-sm transition-colors',
                  current === null ? 'bg-signal text-paper' : 'bg-[#1b130c]/75 text-[#f3e4c3] hover:bg-[#3e2716]',
                )}
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
                  className={cn(
                    'label-mono rounded px-3 py-2 whitespace-nowrap backdrop-blur-sm transition-colors',
                    current === unit.decade ? 'bg-signal text-paper' : 'bg-[#1b130c]/75 text-[#f3e4c3] hover:bg-[#3e2716]',
                  )}
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
