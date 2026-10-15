/**
 * Ventana de la tienda 3D (buscar, cuenta, favoritos, añadir a la colección): el mismo
 * marco de latón y fondo de madera que la cartela del disco en la mano.
 *
 * Los componentes de la web (campos, botones, listas) usan los colores del tema
 * (ink, paper, rule…). Aquí se redefinen esas variables solo dentro de la ventana,
 * así que se ven con la paleta de la tienda sin duplicarlos.
 */
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

export const STORE_THEME = {
  '--color-ink': '#f3e4c3',
  '--color-ink-soft': 'rgb(243 228 195 / 0.82)',
  '--color-ink-faint': 'rgb(232 201 143 / 0.7)',
  '--color-paper': '#2a1a0e',
  '--color-paper-deep': '#3e2716',
  '--color-rule': 'rgb(232 201 143 / 0.25)',
  '--color-signal-deep': '#ff8a6b',
} as CSSProperties

export const storeButton =
  'label-mono rounded-sm border border-[#e8c98f]/50 px-3 py-2 text-[#f3e4c3] transition-colors hover:border-[#e8c98f] hover:bg-[#e8c98f]/10'

export const storeButtonPrimary =
  'label-mono rounded-sm bg-[#f3e4c3] px-4 py-2.5 text-[#1b130c] transition-colors hover:bg-signal hover:text-paper disabled:opacity-50'

interface StoreWindowProps {
  title: string
  /** Línea pequeña bajo el título. */
  subtitle?: ReactNode
  /** Símbolo del sello redondo rojo (como el puesto en la lista de la cartela). */
  badge: ReactNode
  footer?: ReactNode
  onClose: () => void
  children: ReactNode
}

/** Hay un diálogo nativo abierto encima (el escáner de la cámara): Esc es suyo. */
const nestedDialogOpen = () => !!document.querySelector('dialog[open]')

export function StoreWindow({ title, subtitle, badge, footer, onClose, children }: StoreWindowProps) {
  const panel = useRef<HTMLElement>(null)

  useEffect(() => {
    // Si no hay un campo con autofocus, el foco va a la ventana (para Esc y lectores de pantalla).
    if (!panel.current?.contains(document.activeElement)) panel.current?.focus({ preventScroll: true })
  }, [])

  // Esc cierra aunque el foco se haya salido de la ventana (p. ej. al desaparecer un botón).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !nestedDialogOpen()) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="absolute inset-0 z-30 flex items-end justify-center bg-black/45 p-3 sm:items-center sm:p-6"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <section
        ref={panel}
        data-hud
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={STORE_THEME}
        // Lo que se escribe aquí no mueve la cámara. Al frenar la propagación, el Esc
        // de dentro no llega a window: se atiende aquí.
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Escape' && !nestedDialogOpen()) onClose()
        }}
        onKeyUp={(e) => e.stopPropagation()}
        className="pointer-events-auto flex max-h-[92dvh] w-full max-w-3xl animate-[bar-in_420ms_var(--ease-out-soft)] flex-col overflow-hidden rounded-sm border-2 border-[#e8c98f] bg-[#3e2716]/95 p-4 text-[#f3e4c3] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.85)] backdrop-blur-sm focus:outline-none sm:p-5"
      >
        <div className="flex items-start gap-4">
          <span aria-hidden className="grid size-14 shrink-0 -rotate-6 place-items-center rounded-full bg-signal font-display text-2xl text-paper shadow-md">
            {badge}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl leading-tight font-semibold italic sm:text-3xl">{title}</h2>
            {subtitle && <p className="label-mono mt-1 text-[#e8c98f]/80">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className={storeButton} aria-keyshortcuts="Escape">
            Cerrar <span aria-hidden>✕</span>
          </button>
        </div>

        <div className="mt-4 min-h-0 overflow-y-auto overscroll-contain border-t border-[#e8c98f]/25 pt-4 pr-1 [scrollbar-color:rgb(232_201_143/0.45)_transparent] [scrollbar-width:thin]">{children}</div>

        {footer && <p className="label-mono mt-3 text-[#e8c98f]/60">{footer}</p>}
      </section>
    </div>
  )
}
