import { Outlet } from 'react-router-dom'
import { DemoBanner } from './DemoBanner'
import { SiteHeader } from './SiteHeader'

/** Páginas «de web» (búsqueda, artista, estanterías…): cabecera, contenido y pie. */
export function AppShell() {
  return (
    <>
      <a
        href="#contenido"
        className="label-mono sr-only z-50 bg-ink px-3 py-2 text-paper focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <DemoBanner />
      <SiteHeader />
      <main id="contenido" className="mx-auto max-w-7xl overflow-x-clip px-4 pb-24 sm:px-8">
        <Outlet />
      </main>
      <footer className="border-t border-rule pb-20">
        <p className="label-mono mx-auto max-w-7xl px-4 py-6 text-ink-faint sm:px-8">
          Información musical: MusicBrainz · Portadas: Cover Art Archive · Demos de audio: Apple Music
        </p>
      </footer>
    </>
  )
}
