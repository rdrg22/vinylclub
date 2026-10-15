/**
 * Ventana Ajustes de la tienda. Cada ajuste es una sección: para añadir uno nuevo basta
 * con otra <Setting> con sus controles.
 */
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { QUALITY, QUALITY_ORDER, type Quality } from './quality'
import { StoreWindow } from './StoreWindow'

interface Props {
  quality: Quality
  onQuality: (quality: Quality) => void
  fullscreen: boolean
  onToggleFullscreen: () => void
  showStats: boolean
  onShowStats: (show: boolean) => void
  onClose: () => void
}

export function SettingsWindow({ quality, onQuality, fullscreen, onToggleFullscreen, showStats, onShowStats, onClose }: Props) {
  return (
    <StoreWindow title="Ajustes" badge="⚙" subtitle="Se aplican al momento" footer="Esc para cerrar" onClose={onClose}>
      <div className="divide-y divide-rule">
        <Setting title="Calidad gráfica" description="Al abrir la tienda siempre empieza en Media.">
          <div role="radiogroup" aria-label="Calidad gráfica" className="grid gap-2 sm:grid-cols-3">
            {QUALITY_ORDER.map((q) => {
              const selected = q === quality
              return (
                <button
                  key={q}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onQuality(q)}
                  className={cn(
                    'flex flex-col items-start justify-start rounded-sm border p-3 text-left transition-colors',
                    selected ? 'border-[#e8c98f] bg-[#e8c98f]/15' : 'border-[#e8c98f]/30 hover:border-[#e8c98f]/70 hover:bg-[#e8c98f]/5',
                  )}
                >
                  <span className="flex items-center gap-2 font-display text-xl font-semibold italic">
                    <span aria-hidden className={cn('size-3 rounded-full border border-[#e8c98f]', selected && 'bg-signal')} />
                    {QUALITY[q].label}
                  </span>
                  <span className="mt-1 block text-sm text-ink-soft">{QUALITY[q].description}</span>
                </button>
              )
            })}
          </div>
        </Setting>

        <Setting title="Pantalla completa" description="La tienda ocupa toda la pantalla, sin barras del navegador.">
          <Toggle checked={fullscreen} onChange={onToggleFullscreen} label="Pantalla completa" />
        </Setting>

        <Setting title="Mostrar rendimiento" description="Fotogramas por segundo y carga de la escena, arriba a la izquierda.">
          <Toggle checked={showStats} onChange={() => onShowStats(!showStats)} label="Mostrar rendimiento" />
        </Setting>
      </div>
    </StoreWindow>
  )
}

function Setting({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4 first:pt-0">
      <div className="min-w-0 flex-1 basis-56">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-ink-soft">{description}</p>
      </div>
      <div className={cn('shrink-0', title === 'Calidad gráfica' && 'w-full')}>{children}</div>
    </section>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn('relative h-7 w-12 rounded-full border border-[#e8c98f]/60 transition-colors', checked ? 'bg-signal' : 'bg-black/30')}
    >
      <span
        aria-hidden
        className={cn('absolute top-0.5 size-5.5 rounded-full bg-[#f3e4c3] shadow transition-[left] duration-200', checked ? 'left-[calc(100%-1.5rem)]' : 'left-0.5')}
      />
    </button>
  )
}
