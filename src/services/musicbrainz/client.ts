/**
 * Cliente HTTP de MusicBrainz (https://musicbrainz.org/doc/MusicBrainz_API).
 *
 * - Una sola cola para toda la app: como máximo 1 petición por segundo
 *   (https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting).
 * - Caché en memoria con caducidad y deduplicación de peticiones idénticas en curso.
 * - Las peticiones canceladas antes de su turno no consumen hueco en la cola.
 * - Reintentos con espera creciente ante 503 (límite superado o servicio saturado).
 */
import { env } from '@/config/env'
import { abortError, fetchJson, HttpError, isAbortError } from '@/services/http'

const BASE_URL = 'https://musicbrainz.org/ws/2'
/** Margen sobre 1 s para no rozar el límite por desfases de reloj o de red. */
const MIN_INTERVAL_MS = 1100
const CACHE_TTL_MS = 60 * 60 * 1000
const CACHE_MAX_ENTRIES = 300
const MAX_RETRIES = 2
const RETRY_BASE_MS = 2000

/**
 * MusicBrainz pide un User-Agent que identifique la app, su versión y un contacto.
 * Ojo: Chrome y Safari no permiten a una web cambiar este encabezado y lo ignoran
 * en silencio; Firefox sí lo envía. En los demás casos el servidor identifica la app por su Origin.
 */
export const USER_AGENT = `VinylClub/${__APP_VERSION__}${env.musicBrainzContact ? ` ( ${env.musicBrainzContact} )` : ''}`

type Params = Record<string, string | number | undefined>

// ---------------------------------------------------------------- cola

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(abortError())
      },
      { once: true },
    )
  })

let lastRequestAt = 0
let queueTail: Promise<unknown> = Promise.resolve()
/** Solo para depuración/verificación: instantes en que salió cada petición. */
export const requestLog: number[] = []

function enqueue<T>(task: () => Promise<T>, signal: AbortSignal): Promise<T> {
  const run = queueTail.then(async () => {
    if (signal.aborted) throw abortError()
    const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now()
    if (wait > 0) await sleep(wait, signal)
    lastRequestAt = Date.now()
    requestLog.push(lastRequestAt)
    if (requestLog.length > 100) requestLog.shift()
    return task()
  })
  queueTail = run.catch(() => undefined)
  return run
}

// ---------------------------------------------------------------- caché

const cache = new Map<string, { expires: number; data: unknown }>()

function readCache<T>(url: string): T | undefined {
  const hit = cache.get(url)
  if (!hit) return undefined
  if (hit.expires < Date.now()) {
    cache.delete(url)
    return undefined
  }
  // Reinsertar mantiene el orden de uso reciente (LRU sencillo).
  cache.delete(url)
  cache.set(url, hit)
  return hit.data as T
}

function writeCache(url: string, data: unknown) {
  cache.set(url, { expires: Date.now() + CACHE_TTL_MS, data })
  if (cache.size > CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
}

// ---------------------------------------------------------------- petición

async function execute<T>(url: string, signal: AbortSignal): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await enqueue(
        () =>
          fetchJson<T>(url, {
            signal,
            timeoutMs: 15_000,
            headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
          }),
        signal,
      )
    } catch (error) {
      const retryable = error instanceof HttpError && (error.status === 503 || error.status === 429)
      if (!retryable || attempt >= MAX_RETRIES) throw error
      await sleep(RETRY_BASE_MS * 2 ** attempt, signal)
    }
  }
}

interface InFlight {
  promise: Promise<unknown>
  controller: AbortController
  waiters: number
}
const inFlight = new Map<string, InFlight>()

export function buildUrl(path: string, params: Params = {}): string {
  const search = new URLSearchParams({ fmt: 'json' })
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  return `${BASE_URL}/${path}?${search}`
}

/**
 * GET a la API. Varias llamadas idénticas comparten una sola petición; esta solo
 * se cancela de verdad cuando todos los que la esperaban han cancelado.
 */
export function mbGet<T>(path: string, params: Params = {}, signal?: AbortSignal): Promise<T> {
  const url = buildUrl(path, params)
  const cached = readCache<T>(url)
  if (cached !== undefined) return Promise.resolve(cached)
  if (signal?.aborted) return Promise.reject(abortError())

  let entry = inFlight.get(url)
  if (!entry) {
    const controller = new AbortController()
    const created: InFlight = {
      controller,
      waiters: 0,
      promise: execute<T>(url, controller.signal)
        .then((data) => {
          writeCache(url, data)
          return data
        })
        .finally(() => {
          if (inFlight.get(url) === created) inFlight.delete(url)
        }),
    }
    // Evita avisos de promesa rechazada sin manejar si todos cancelan.
    created.promise.catch(() => undefined)
    inFlight.set(url, created)
    entry = created
  }

  const shared = entry
  shared.waiters++
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      shared.waiters--
      if (shared.waiters === 0) {
        shared.controller.abort()
        // Una llamada posterior con la misma URL creará una petición nueva.
        if (inFlight.get(url) === shared) inFlight.delete(url)
      }
      reject(abortError())
    }
    signal?.addEventListener('abort', onAbort, { once: true })
    shared.promise.then(
      (data) => {
        signal?.removeEventListener('abort', onAbort)
        resolve(data as T)
      },
      (error: unknown) => {
        signal?.removeEventListener('abort', onAbort)
        if (!signal?.aborted) reject(isAbortError(error) ? abortError() : error)
      },
    )
  })
}

/** Mensaje legible para la interfaz a partir de un error del cliente. */
export function describeMusicBrainzError(error: unknown): string {
  if (error instanceof HttpError) {
    if (error.status === 503 || error.status === 429)
      return 'MusicBrainz está recibiendo demasiadas peticiones. Espera unos segundos e inténtalo de nuevo.'
    if (error.status === 400) return 'MusicBrainz no ha entendido la búsqueda. Prueba con otras palabras.'
    if (error.status === 404) return 'MusicBrainz no tiene este registro.'
    if (error.status && error.status >= 500) return 'MusicBrainz no está disponible en este momento.'
    if (error.message === 'Tiempo de espera agotado') return 'MusicBrainz está tardando demasiado en responder.'
    return 'No se ha podido conectar con MusicBrainz. Revisa tu conexión.'
  }
  return 'Ha ocurrido un error inesperado al consultar MusicBrainz.'
}
