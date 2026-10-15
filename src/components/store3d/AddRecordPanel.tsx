/**
 * Ventana para añadir un disco a la colección desde la tienda 3D (al pulsar el hueco «+»).
 * Mismo buscador que «Mi colección» (código de barras o título), vestido como las
 * cartelas de la tienda: la paleta clara de la web se cambia por la de madera y latón
 * redefiniendo los colores del tema solo dentro del panel.
 */
import { useEffect, useRef, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/components/auth/authContext'
import { AddRecord } from '@/components/collection/AddRecord'
import { useCollection } from '@/components/collection/collectionContext'

const STORE_THEME = {
  '--color-ink': '#f3e4c3',
  '--color-ink-soft': 'rgb(243 228 195 / 0.82)',
  '--color-ink-faint': 'rgb(232 201 143 / 0.7)',
  '--color-paper': '#2a1a0e',
  '--color-rule': 'rgb(232 201 143 / 0.25)',
  '--color-signal-deep': '#ff8a6b',
} as CSSProperties

const button =
  'label-mono rounded-sm border border-[#e8c98f]/50 px-3 py-2 text-[#f3e4c3] transition-colors hover:border-[#e8c98f] hover:bg-[#e8c98f]/10'

export function AddRecordPanel({ onClose }: { onClose: () => void }) {
  const auth = useAuth()
  const { items, where } = useCollection()
  const panel = useRef<HTMLElement>(null)
  const signedOut = auth.state.status === 'signed-out'

  useEffect(() => {
    panel.current?.focus({ preventScroll: true })
  }, [])

  // Esc cierra aunque el foco se haya ido del panel (p. ej. tras pulsar «+ Añadir»),
  // salvo con el escáner de la cámara abierto: entonces Esc cierra solo el escáner.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('dialog[open]')) onClose()
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
        aria-labelledby="add-panel-title"
        style={STORE_THEME}
        // Lo que se escribe aquí no mueve la cámara por la tienda.
        onKeyDown={(e) => {
          // Al frenar la propagación, el Esc de dentro del panel no llega a window: se atiende aquí.
          e.stopPropagation()
          if (e.key === 'Escape' && !document.querySelector('dialog[open]')) onClose()
        }}
        onKeyUp={(e) => e.stopPropagation()}
        className="pointer-events-auto flex max-h-[92dvh] w-full max-w-3xl animate-[bar-in_420ms_var(--ease-out-soft)] flex-col overflow-hidden rounded-sm border-2 border-[#e8c98f] bg-[#3e2716]/95 p-4 text-[#f3e4c3] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.85)] backdrop-blur-sm focus:outline-none sm:p-5"
      >
        <div className="flex items-start gap-4">
          <span aria-hidden className="grid size-14 shrink-0 -rotate-6 place-items-center rounded-full bg-signal font-display text-3xl text-paper shadow-md">
            +
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="add-panel-title" className="font-display text-2xl leading-tight font-semibold italic sm:text-3xl">
              Añadir a tu colección
            </h2>
            <p className="label-mono mt-1 text-[#e8c98f]/80">
              {signedOut
                ? 'Necesitas una cuenta'
                : `${items.length === 1 ? '1 disco' : `${items.length} discos`}${where === 'browser' ? ' · solo en este navegador' : ''}`}
            </p>
          </div>
          <button type="button" onClick={onClose} className={button} aria-keyshortcuts="Escape">
            Cerrar <span aria-hidden>✕</span>
          </button>
        </div>

        <div className="mt-4 min-h-0 overflow-y-auto border-t border-[#e8c98f]/25 pt-4">
          {signedOut ? (
            <div className="space-y-4">
              <p className="text-[#f3e4c3]/85">Entra con tu cuenta para registrar tus discos: aparecerán aquí, en esta estantería.</p>
              <div className="flex flex-wrap gap-3">
                <Link to="/entrar?siguiente=/" className="label-mono rounded-sm bg-[#f3e4c3] px-4 py-2.5 text-[#1b130c] hover:bg-signal hover:text-paper">
                  Entrar o crear cuenta
                </Link>
              </div>
            </div>
          ) : auth.state.status === 'loading' ? (
            <p className="label-mono text-[#e8c98f]/80">Comprobando tu sesión…</p>
          ) : (
            <AddRecord variant="panel" />
          )}
        </div>

        <p className="label-mono mt-3 text-[#e8c98f]/60">Datos de MusicBrainz · Esc para cerrar</p>
      </section>
    </div>
  )
}
