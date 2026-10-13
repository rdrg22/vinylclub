import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '@/utils/cn'

/** Buscador de la cabecera. Envía a /buscar?q=…; la tecla «/» lo enfoca. */
export function SearchBox({ className }: { className?: string }) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const urlQuery = pathname === '/buscar' ? (params.get('q') ?? '') : ''
  const [value, setValue] = useState(urlQuery)

  // Mantiene el campo sincronizado al navegar por el historial.
  useEffect(() => {
    setValue(urlQuery)
  }, [urlQuery])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = target?.closest('input, textarea, select, [contenteditable="true"]')
      if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const q = value.trim()
    if (!q) return inputRef.current?.focus()
    // Una búsqueda nueva conserva la pestaña (discos/artistas/ediciones) y vuelve a la página 1.
    const tipo = pathname === '/buscar' ? params.get('tipo') : null
    navigate(`/buscar?${new URLSearchParams({ q, ...(tipo ? { tipo } : {}) })}`)
  }

  return (
    <form role="search" onSubmit={onSubmit} className={cn('group relative flex items-center', className)}>
      <label htmlFor={id} className="sr-only">
        Buscar artista, álbum o canción
      </label>
      <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute left-0 size-4 text-ink-faint">
        <circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="m13 13 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        id={id}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Artista, álbum…"
        autoComplete="off"
        enterKeyHint="search"
        className="w-full border-b border-rule bg-transparent py-2 pr-8 pl-7 text-[15px] placeholder:text-ink-faint transition-colors focus:border-ink focus:outline-none"
      />
      <kbd
        aria-hidden
        className="label-mono pointer-events-none absolute right-0 hidden border border-rule px-1.5 text-ink-faint group-focus-within:opacity-0 md:block"
      >
        /
      </kbd>
    </form>
  )
}
