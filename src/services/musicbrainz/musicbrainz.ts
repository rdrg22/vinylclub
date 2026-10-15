/**
 * Operaciones de MusicBrainz que usa la app. Todas devuelven tipos de `@/types/music`.
 * La paginación es explícita (página a página): nunca se encadenan peticiones al desplazarse.
 */
import type { Album, AlbumDetails, Artist, Page, Release } from '@/types/music'
import type { ShelfFilters } from '@/types/shelf'
import type { MbArtist, MbReleaseGroup, MbSearchResponse } from './apiTypes'
import { mbGet } from './client'
import { albumTextQuery } from './lucene'
import { HttpError } from '@/services/http'

const MBID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isMbid = (value: string) => MBID.test(value)
import { toAlbum, toAlbumDetails, toArtist, toRelease, uniqueById } from './normalize'
import { buildShelfQuery, type ShelfQuery } from './shelfQuery'

export const PAGE_SIZE = 24
/** Las búsquedas de MusicBrainz admiten hasta 100 resultados por página. */
const MAX_LIMIT = 100

const pageParams = (page: number, limit = PAGE_SIZE) => ({
  limit: Math.min(limit, MAX_LIMIT),
  offset: Math.max(0, page - 1) * limit,
})

function toPage<T>(items: T[], response: MbSearchResponse, limit: number): Page<T> {
  return { items, total: response.count ?? items.length, offset: response.offset ?? 0, limit }
}

// ---------------------------------------------------------------- búsquedas de texto libre
// El texto del usuario nunca se pasa tal cual como sintaxis Lucene: o se escapa
// (discos) o se usa `dismax=true`, que lo trata como texto plano (artistas, ediciones).

/** Discos (release groups) por título, artista o ambos («radiohead ok computer»). */
export async function searchAlbums(text: string, page = 1, signal?: AbortSignal): Promise<Page<Album>> {
  const params = pageParams(page)
  const res = await mbGet<MbSearchResponse>('release-group', { query: albumTextQuery(text), ...params }, signal)
  return toPage(uniqueById((res['release-groups'] ?? []).map((g) => toAlbum(g))), res, params.limit)
}

export async function searchArtists(text: string, page = 1, signal?: AbortSignal): Promise<Page<Artist>> {
  const params = pageParams(page)
  const res = await mbGet<MbSearchResponse>('artist', { query: text, dismax: 'true', ...params }, signal)
  return toPage(uniqueById((res.artists ?? []).map(toArtist)), res, params.limit)
}

/** Ediciones concretas (país, fecha, formato, sello). */
export async function searchReleases(text: string, page = 1, signal?: AbortSignal): Promise<Page<Release>> {
  const params = pageParams(page)
  const res = await mbGet<MbSearchResponse>('release', { query: text, dismax: 'true', ...params }, signal)
  return toPage(uniqueById((res.releases ?? []).map(toRelease)), res, params.limit)
}

// ---------------------------------------------------------------- consultas por MBID

export async function getAlbumDetails(id: string, signal?: AbortSignal): Promise<AlbumDetails> {
  if (!isMbid(id)) throw new HttpError('MBID no válido', 400)
  const group = await mbGet<MbReleaseGroup>(`release-group/${id}`, { inc: 'artist-credits+genres+tags+releases' }, signal)
  return toAlbumDetails(group)
}

export async function getArtist(id: string, signal?: AbortSignal): Promise<Artist> {
  if (!isMbid(id)) throw new HttpError('MBID no válido', 400)
  return toArtist(await mbGet<MbArtist>(`artist/${id}`, { inc: 'tags' }, signal))
}

/**
 * Discografía de un artista: álbumes y EP con alguna edición oficial, ordenados por fecha.
 * Si el artista no tiene ninguno oficial (maquetas, autoediciones…), se muestran todos.
 * Bloques de 100 (máximo de la API) para que el orden por fecha tenga sentido.
 */
export async function getArtistDiscography(artistId: string, page = 1, signal?: AbortSignal): Promise<Page<Album>> {
  if (!isMbid(artistId)) throw new HttpError('MBID no válido', 400)
  const params = pageParams(page, MAX_LIMIT)
  const base = `arid:${artistId} AND (primarytype:album OR primarytype:ep)`
  let res = await mbGet<MbSearchResponse>('release-group', { query: `${base} AND status:official`, ...params }, signal)
  if (!res.count && page === 1) res = await mbGet<MbSearchResponse>('release-group', { query: base, ...params }, signal)

  const items = uniqueById((res['release-groups'] ?? []).map((g) => toAlbum(g))).sort((a, b) =>
    (a.firstReleaseDate ?? '9999').localeCompare(b.firstReleaseDate ?? '9999'),
  )
  return toPage(items, res, params.limit)
}

// ---------------------------------------------------------------- estanterías

export interface ShelfResult {
  page: Page<Album>
  query: ShelfQuery
}

/**
 * Discos que cumplen los filtros verificables de una estantería.
 * Con «Selección aleatoria» se consulta primero el total (petición cacheada) y
 * después una página al azar dentro de los primeros 1000 resultados.
 */
export async function searchShelfAlbums(filters: ShelfFilters, page = 1, signal?: AbortSignal): Promise<ShelfResult> {
  const query = buildShelfQuery(filters)
  if (!query.query) return { page: { items: [], total: 0, offset: 0, limit: PAGE_SIZE }, query }

  let params = pageParams(page)
  if (query.randomize) {
    const probe = await mbGet<MbSearchResponse>('release-group', { query: query.query, limit: 1 }, signal)
    const pages = Math.max(1, Math.min(Math.ceil((probe.count ?? 0) / PAGE_SIZE), Math.floor(1000 / PAGE_SIZE)))
    params = pageParams(1 + Math.floor(Math.random() * pages))
  }

  const res = await mbGet<MbSearchResponse>('release-group', { query: query.query, ...params }, signal)
  return { page: toPage(uniqueById((res['release-groups'] ?? []).map((g) => toAlbum(g))), res, params.limit), query }
}

// ---------------------------------------------------------------- colección

/** Los vinilos primero; dentro de cada grupo se respeta el orden de relevancia de MusicBrainz. */
const vinylFirst = (releases: Release[]) =>
  releases
    .map((release, i) => ({ release, i, vinyl: release.formats.some((f) => /vinyl/i.test(f)) }))
    .sort((a, b) => Number(b.vinyl) - Number(a.vinyl) || a.i - b.i)
    .map((x) => x.release)

/**
 * Ediciones con ese código de barras. Recibe las variantes ya normalizadas (solo cifras),
 * así que no hay texto del usuario en la consulta Lucene.
 */
export async function searchReleasesByBarcode(variants: string[], signal?: AbortSignal): Promise<Release[]> {
  const digits = variants.filter((v) => /^\d+$/.test(v))
  if (digits.length === 0) return []
  const res = await mbGet<MbSearchResponse>('release', { query: `barcode:(${digits.join(' OR ')})`, limit: 25 }, signal)
  return vinylFirst(uniqueById((res.releases ?? []).map(toRelease)))
}

/** Ediciones por título y/o artista («pink floyd the wall»), con los vinilos primero. */
export async function searchReleasesForCollection(text: string, signal?: AbortSignal): Promise<Release[]> {
  const res = await mbGet<MbSearchResponse>('release', { query: text, dismax: 'true', limit: 40 }, signal)
  return vinylFirst(uniqueById((res.releases ?? []).map(toRelease)))
}
