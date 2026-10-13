export class HttpError extends Error {
  constructor(
    message: string,
    /** Código HTTP; ausente en errores de red o de tiempo de espera. */
    readonly status?: number,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError'

export const abortError = () => new DOMException('Petición cancelada', 'AbortError')

interface FetchJsonOptions extends Omit<RequestInit, 'signal'> {
  timeoutMs?: number
  /** Cancelación externa: se propaga como AbortError, no como HttpError. */
  signal?: AbortSignal
}

/** GET de JSON con tiempo límite. Lanza HttpError en fallos de red o respuestas no 2xx. */
export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const { timeoutMs = 10_000, signal, ...rest } = options
  const timeout = AbortSignal.timeout(timeoutMs)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout

  try {
    const response = await fetch(url, { ...rest, signal: combined })
    if (!response.ok) throw new HttpError(`Respuesta ${response.status} de ${new URL(url).host}`, response.status)
    return (await response.json()) as T
  } catch (error) {
    if (error instanceof HttpError) throw error
    if (signal?.aborted) throw abortError()
    throw new HttpError(timeout.aborted ? 'Tiempo de espera agotado' : 'Error de red')
  }
}
