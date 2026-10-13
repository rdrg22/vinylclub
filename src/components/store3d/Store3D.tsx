import { lazy, Suspense, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DECADE_OPTIONS } from '@/config/shelfFilters'
import { CHART_ALBUMS, decadeOf, firstChartYear } from '@/data/charts/chartCatalog'
import type { DecadeInput } from './layout'

// three.js pesa: solo se descarga cuando se va a mostrar la tienda.
const StoreExperience = lazy(() => import('./StoreExperience'))

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function useDecades(): DecadeInput[] {
  return useMemo(() => {
    const byDecade = new Map<string, DecadeInput['albums']>()
    for (const album of CHART_ALBUMS) {
      const first = album.charts?.[0]
      if (!first) continue
      const decade = decadeOf(firstChartYear(album))
      byDecade.set(decade, [...(byDecade.get(decade) ?? []), { album, year: first.year, rank: first.rank }])
    }
    return DECADE_OPTIONS.filter((o) => byDecade.has(o.value)).map((o) => ({
      decade: o.value,
      label: o.label,
      albums: byDecade.get(o.value) ?? [],
    }))
  }, [])
}

function Poster({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-full place-items-center bg-[#1b130c] p-6 text-center text-[#f3e4c3]">
      <div className="max-w-md">{children}</div>
    </div>
  )
}

/** Entrada a la tienda 3D, con alternativa si el dispositivo no tiene WebGL. */
export function Store3D() {
  const decades = useDecades()
  const [webgl] = useState(supportsWebGL)

  if (!webgl) {
    return (
      <Poster>
        <p className="label-mono text-[#e8c98f]">Tienda 3D no disponible</p>
        <p className="mt-3 font-display text-2xl">Tu navegador no permite gráficos 3D (WebGL).</p>
        <p className="mt-2 text-[#f3e4c3]/75">
          Puedes recorrer los mismos discos en{' '}
          <Link to="/estanterias" className="underline underline-offset-2">
            las estanterías en lista
          </Link>
          .
        </p>
      </Poster>
    )
  }

  return (
    <Suspense
      fallback={
        <Poster>
          <span aria-hidden className="vinyl vinyl-spin mx-auto block size-16" />
          <p className="label-mono mt-5 text-[#e8c98f]" role="status">
            Abriendo la tienda…
          </p>
        </Poster>
      }
    >
      <StoreExperience decades={decades} />
    </Suspense>
  )
}
