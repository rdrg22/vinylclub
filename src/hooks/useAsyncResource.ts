import { useCallback, useEffect, useRef, useState } from 'react'
import { isAbortError } from '@/services/http'

export type Resource<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: unknown }

/**
 * Carga asíncrona identificada por una clave. Solo vuelve a pedir datos cuando
 * cambia la clave (o al reintentar), nunca por re-renderizar; al cambiar de clave
 * o desmontarse cancela la petición anterior. `key = null` deja el recurso en reposo.
 */
export function useAsyncResource<T>(
  key: string | null,
  load: (signal: AbortSignal) => Promise<T>,
): Resource<T> & { retry: () => void } {
  const loadRef = useRef(load)
  loadRef.current = load
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{ key: string | null; attempt: number; resource: Resource<T> }>({
    key: null,
    attempt: 0,
    resource: { status: 'idle' },
  })

  useEffect(() => {
    if (key === null) return
    const controller = new AbortController()
    loadRef
      .current(controller.signal)
      .then((data) => setState({ key, attempt, resource: { status: 'success', data } }))
      .catch((error: unknown) => {
        if (!isAbortError(error)) setState({ key, attempt, resource: { status: 'error', error } })
      })
    return () => controller.abort()
  }, [key, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  // El resultado guardado solo vale para la clave e intento actuales.
  let resource: Resource<T>
  if (key === null) resource = { status: 'idle' }
  else if (state.key === key && state.attempt === attempt) resource = state.resource
  else resource = { status: 'loading' }

  return { ...resource, retry }
}
