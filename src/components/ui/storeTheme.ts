import type { CSSProperties } from 'react'

/**
 * Paleta de la tienda (madera y latón) aplicada a componentes de la web: redefine los
 * colores del tema (ink, paper, rule…) solo dentro del elemento que la lleve.
 */
export const STORE_THEME = {
  '--color-ink': '#f3e4c3',
  '--color-ink-soft': 'rgb(243 228 195 / 0.82)',
  '--color-ink-faint': 'rgb(232 201 143 / 0.7)',
  '--color-paper': '#2a1a0e',
  '--color-paper-deep': '#3e2716',
  '--color-rule': 'rgb(232 201 143 / 0.25)',
  '--color-signal-deep': '#ff8a6b',
} as CSSProperties

/** Marco de las cartelas y ventanas de la tienda. */
export const STORE_FRAME =
  'rounded-sm border-2 border-[#e8c98f] bg-[#3e2716]/95 text-[#f3e4c3] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.85)] backdrop-blur-sm'
