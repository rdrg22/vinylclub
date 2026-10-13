import { siApplemusic, siSoundcloud, siSpotify, siTidal } from 'simple-icons'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { getListenLinks, searchLinks, type ListenLink, type ListenService } from '@/services/listen/listenLinks'
import type { Album } from '@/types/music'
import { cn } from '@/utils/cn'

const SERVICES: Record<ListenService, { name: string; color: string; path?: string }> = {
  apple: { name: 'Apple Music', color: `#${siApplemusic.hex}`, path: siApplemusic.path },
  spotify: { name: 'Spotify', color: `#${siSpotify.hex}`, path: siSpotify.path },
  tidal: { name: 'Tidal', color: '#111111', path: siTidal.path },
  soundcloud: { name: 'SoundCloud', color: `#${siSoundcloud.hex}`, path: siSoundcloud.path },
  // Amazon no publica su logotipo en Simple Icons: carrito genérico + nombre.
  amazon: { name: 'Amazon', color: '#232F3E' },
}

/** Logos oficiales vía Simple Icons (CC0); carrito genérico para la compra. */
function ServiceIcon({ service }: { service: ListenService }) {
  const { path } = SERVICES[service]
  if (!path) {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2" />
        <circle cx="9.5" cy="20" r="1.2" />
        <circle cx="17.5" cy="20" r="1.2" />
      </svg>
    )
  }
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="currentColor">
      <path d={path} />
    </svg>
  )
}

function LinkButton({ link }: { link: ListenLink }) {
  const { name, color } = SERVICES[link.service]
  const isBuy = link.service === 'amazon'
  const label = `${isBuy ? 'Comprar en' : 'Escuchar en'} ${name}${link.kind === 'search' ? ' (búsqueda del disco)' : ''}`
  return (
    <li>
      <a
        href={link.url}
        target="_blank"
        rel="noreferrer"
        aria-label={label}
        title={label}
        className="group flex flex-col items-center gap-1.5"
      >
        <span
          className="relative grid size-11 place-items-center rounded-full text-white shadow-sm transition-transform duration-200 ease-out-soft group-hover:-translate-y-0.5 group-hover:scale-105"
          style={{ backgroundColor: color }}
        >
          <ServiceIcon service={link.service} />
          {link.kind === 'search' && (
            <span aria-hidden className="absolute -right-0.5 -bottom-0.5 grid size-4 place-items-center rounded-full bg-paper text-ink ring-1 ring-rule">
              <svg viewBox="0 0 16 16" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="7" cy="7" r="4.5" />
                <path d="m10.5 10.5 3.5 3.5" strokeLinecap="round" />
              </svg>
            </span>
          )}
        </span>
        <span className="label-mono text-[0.6rem] text-ink-soft">{name}</span>
      </a>
    </li>
  )
}

/**
 * «Escuchar en» + «Comprar». Los enlaces de búsqueda se muestran al instante;
 * el de Apple Music pasa a directo cuando se verifica el álbum.
 */
export function ListenLinks({ album, className }: { album: Album; className?: string }) {
  const resource = useAsyncResource(`listen|${album.artist}|${album.title}`, (signal) => getListenLinks(album, signal))
  const fallback = searchLinks(album)
  const links = resource.status === 'success' ? resource.data : [fallback.apple, fallback.spotify, fallback.tidal, fallback.soundcloud, fallback.amazon]
  const listen = links.filter((l) => l.service !== 'amazon')
  const buy = links.filter((l) => l.service === 'amazon')

  return (
    <div className={cn('flex flex-wrap items-start gap-x-8 gap-y-4', className)}>
      <div>
        <p className="label-mono mb-2 text-ink-faint">Escuchar en</p>
        <ul className="flex gap-3">
          {listen.map((link) => (
            <LinkButton key={link.service} link={link} />
          ))}
        </ul>
      </div>
      <div>
        <p className="label-mono mb-2 text-ink-faint">Comprar</p>
        <ul className="flex gap-3">
          {buy.map((link) => (
            <LinkButton key={link.service} link={link} />
          ))}
        </ul>
      </div>
      <p className="label-mono basis-full text-[0.6rem] text-ink-faint">
        <span aria-hidden>⌕</span> = búsqueda del disco en ese servicio
      </p>
    </div>
  )
}
