import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * El cliente guarda estado de módulo (cola, caché): cada prueba importa una
 * instancia nueva y simula `fetch` para no tocar la API real.
 */
async function freshClient() {
  vi.resetModules()
  return import('./client')
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.useFakeTimers()
  fetchMock = vi.fn(async () => json({ ok: true }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('cliente de MusicBrainz', () => {
  it('espacia las peticiones al menos 1 s', async () => {
    const { mbGet, requestLog } = await freshClient()
    const all = Promise.all([mbGet('artist', { query: 'a' }), mbGet('artist', { query: 'b' }), mbGet('artist', { query: 'c' })])
    await vi.runAllTimersAsync()
    await all
    expect(fetchMock).toHaveBeenCalledTimes(3)
    const gaps = requestLog.slice(1).map((t, i) => t - requestLog[i]!)
    for (const gap of gaps) expect(gap).toBeGreaterThanOrEqual(1000)
  })

  it('comparte una petición idéntica en curso y luego responde desde caché', async () => {
    const { mbGet } = await freshClient()
    const both = Promise.all([mbGet('artist', { query: 'x' }), mbGet('artist', { query: 'x' })])
    await vi.runAllTimersAsync()
    await both
    await mbGet('artist', { query: 'x' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('una petición cancelada antes de su turno no llega a enviarse', async () => {
    const { mbGet } = await freshClient()
    const controller = new AbortController()
    const first = mbGet('artist', { query: 'primera' })
    const second = mbGet('artist', { query: 'segunda' }, controller.signal)
    controller.abort()
    await expect(second).rejects.toMatchObject({ name: 'AbortError' })
    await vi.runAllTimersAsync()
    await first
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('reintenta ante un 503 y acaba resolviendo', async () => {
    fetchMock.mockResolvedValueOnce(json({}, 503)).mockResolvedValueOnce(json({ count: 1 }))
    const { mbGet } = await freshClient()
    const result = mbGet<{ count: number }>('artist', { query: 'retry' })
    await vi.runAllTimersAsync()
    await expect(result).resolves.toEqual({ count: 1 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('no reintenta errores que no son de saturación', async () => {
    fetchMock.mockResolvedValue(json({}, 400))
    const { mbGet, describeMusicBrainzError } = await freshClient()
    const result = mbGet('artist', { query: 'mal' })
    const assertion = expect(result).rejects.toMatchObject({ status: 400 })
    await vi.runAllTimersAsync()
    await assertion
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(describeMusicBrainzError(await result.catch((e: unknown) => e))).toMatch(/no ha entendido/)
  })

  it('envía formato JSON y User-Agent de la app', async () => {
    const { mbGet, USER_AGENT } = await freshClient()
    const p = mbGet('release-group', { query: 'q', limit: 5 })
    await vi.runAllTimersAsync()
    await p
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://musicbrainz.org/ws/2/release-group?fmt=json&query=q&limit=5')
    expect((init.headers as Record<string, string>)['User-Agent']).toBe(USER_AGENT)
    expect(USER_AGENT).toMatch(/^VinylClub\/\d+\.\d+\.\d+/)
  })
})
