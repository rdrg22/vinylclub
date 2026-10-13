/**
 * Localiza en MusicBrainz cada disco de las listas anuales de Billboard y genera
 * el catálogo que usa la tienda (src/data/charts/billboardTop10.json).
 *
 * - Una petición cada 1,1 s con User-Agent identificativo (política de MusicBrainz).
 * - Solo se acepta un release group si coinciden título y artista (o, en bandas
 *   sonoras y musicales, título y tipo «Soundtrack»). Si no hay coincidencia segura
 *   el disco queda sin MBID: no se asigna uno parecido.
 * - Guarda el progreso en scripts/data/mb-matches.json: si se interrumpe, continúa.
 *
 * Uso: node scripts/resolve-chart-albums.mjs [--retry-unmatched]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { comparable } from '../src/utils/text.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CHARTS = join(ROOT, 'scripts/data/billboard-year-end.json')
const CACHE = join(ROOT, 'scripts/data/mb-matches.json')
const OUTPUT = join(ROOT, 'src/data/charts/billboardTop10.json')

const USER_AGENT = 'VinylClub/0.1.0 ( https://github.com/rdrg22/vinylclub )'
/** `--retry-unmatched`: vuelve a intentar los discos que quedaron sin coincidencia. */
const RETRY_UNMATCHED = process.argv.includes('--retry-unmatched')
const MIN_INTERVAL_MS = 1100

/** Las primeras descargas guardaron entidades HTML dobles («&amp;amp;»); se limpian al leer. */
const decodeEntities = (text) => {
  let current = text
  for (let previous; previous !== current; ) {
    previous = current
    current = current.replace(/&amp;/g, '&').replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"')
  }
  return current
}

const charts = JSON.parse(readFileSync(CHARTS, 'utf8'))

// Años que la fuente principal no publica: se completan con el suplemento, que lleva su propia fuente.
const SUPPLEMENT = join(ROOT, 'scripts/data/billboard-supplement.json')
const yearSources = {}
if (existsSync(SUPPLEMENT)) {
  const supplement = JSON.parse(readFileSync(SUPPLEMENT, 'utf8'))
  for (const [year, rows] of Object.entries(supplement.years)) {
    if (charts.years[year]) continue
    charts.years[year] = rows
    yearSources[year] = { source: supplement.source, url: supplement.sourceUrl }
  }
}

for (const rows of Object.values(charts.years)) {
  for (const row of rows) {
    row.title = decodeEntities(row.title)
    row.artist = decodeEntities(row.artist)
  }
}
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {}

// ---------------------------------------------------------------- MusicBrainz

let lastRequest = 0
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function searchReleaseGroups(query) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const wait = lastRequest + MIN_INTERVAL_MS - Date.now()
    if (wait > 0) await sleep(wait)
    lastRequest = Date.now()
    const url = `https://musicbrainz.org/ws/2/release-group?fmt=json&limit=15&query=${encodeURIComponent(query)}`
    let response
    try {
      response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } })
    } catch (error) {
      // Cortes de red puntuales (ECONNRESET, timeouts): se reintenta con espera creciente.
      console.error(`  red: ${error.cause?.code ?? error.message}; reintento ${attempt + 1}`)
      await sleep(2000 * 2 ** attempt)
      continue
    }
    if (response.status === 503 || response.status === 429) {
      await sleep(2000 * 2 ** attempt)
      continue
    }
    if (!response.ok) throw new Error(`MusicBrainz ${response.status} para ${query}`)
    return (await response.json())['release-groups'] ?? []
  }
  throw new Error(`MusicBrainz saturado tras varios intentos: ${query}`)
}

// ---------------------------------------------------------------- coincidencias

const VARIOUS = /^(soundtrack|original (broadway |movie )?cast|various( artists)?|cast recording|original soundtrack)$/i
/** «MY FAIR LADY (ORIGINAL CAST)» → «MY FAIR LADY». */
const cleanTitle = (title) => title.replace(/\s*[([].*?[)\]]\s*/g, ' ').replace(/\s+/g, ' ').trim()
const quote = (s) => `"${s.replace(/["\\]/g, '\\$&')}"`
/** Solo letras y números: evita que «&», «:» o «!» se interpreten como sintaxis Lucene. */
const words = (s) => s.replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\b(AND|OR|NOT)\b/g, (w) => w.toLowerCase()).trim()
const yearOf = (date) => (date ? Number.parseInt(date.slice(0, 4), 10) : NaN)
const credit = (rg) => (rg['artist-credit'] ?? []).map((c) => `${c.name ?? c.artist?.name ?? ''}${c.joinphrase ?? ''}`).join('')

/** Abreviaturas habituales en las listas: «DR. ZHIVAGO» = «Doctor Zhivago». */
const expand = (s) =>
  s
    .replace(/\bdr\.?(?=\s)/gi, 'doctor')
    .replace(/\bmr\.?(?=\s)/gi, 'mister')
    .replace(/\bst\.?(?=\s)/gi, 'saint')
    .replace(/\bvol\.?(?=\s*\d)/gi, 'volume')
const titleKey = (s) => comparable(expand(s))

const OTHER_VERSION = /\b(score|reimagined|karaoke|tribute|instrumentals?|freestyles?|remix(es)?|demos?)\b/i
const SOUNDTRACK_SUFFIX = new Set(['soundtrack', 'originalsoundtrack', 'theoriginalsoundtrack', 'originalcastrecording', 'castrecording'])

/** ¿Empieza `title` por el título buscado seguido de un separador de subtítulo (: , ( ! ? / -)? */
function hasTitlePrefix(title, wantedKey) {
  for (const match of title.matchAll(/[:,(]|[!?](?=\s|$)|\s[-/–]\s/g)) {
    const end = match.index + (match[0] === '!' || match[0] === '?' ? 1 : 0)
    if (titleKey(title.slice(0, end)) === wantedKey) return true
  }
  return false
}

function score(rg, entry, chartYear) {
  const wanted = titleKey(cleanTitle(entry.title))
  const got = titleKey(rg.title ?? '')
  if (!wanted || !got) return -1
  // Versiones que no son el disco de la lista (partitura, «reimagined», karaoke…), salvo que la lista lo diga.
  if (OTHER_VERSION.test(rg.title ?? '') && !OTHER_VERSION.test(entry.title)) return -1

  let points = 0
  if (got === wanted) points += 6
  else if (got.startsWith(wanted)) {
    // MusicBrainz añade un subtítulo («The Sting: Original Motion Picture Soundtrack») o «Soundtrack».
    if (hasTitlePrefix(rg.title ?? '', wanted) || SOUNDTRACK_SUFFIX.has(got.slice(wanted.length))) points += 3
    else return -1
  } else if (wanted.startsWith(got)) {
    // MusicBrainz omite el número: solo en discos homónimos («LED ZEPPELIN I» = «Led Zeppelin»).
    if (got === titleKey(entry.artist)) points += 3
    else return -1
  }
  // Título contenido en el otro («PETER GUN» ⊂ «The Music from Peter Gunn»): solo con artista concreto.
  else if (!VARIOUS.test(entry.artist) && wanted.length >= 6 && (got.includes(wanted) || wanted.includes(got))) points += 1
  else return -1
  // Desempate: el título de longitud más parecida.
  points -= Math.abs(got.length - wanted.length) / 100

  const secondary = rg['secondary-types'] ?? []
  if (VARIOUS.test(entry.artist)) {
    if (!secondary.includes('Soundtrack') && comparable(credit(rg)) !== 'variousartists') return -1
    points += 3
  } else {
    const a = comparable(entry.artist)
    const names = [credit(rg), ...(rg['artist-credit'] ?? []).map((c) => c.artist?.name ?? '')].map(comparable)
    if (!names.some((n) => n && (n === a || n.includes(a) || a.includes(n)))) return -1
    points += 6
  }

  if (rg['primary-type'] === 'Album') points += 2
  if (secondary.includes('Live') || secondary.includes('Compilation')) points -= 1
  // Un disco no puede entrar en la lista anual antes de publicarse; los muy antiguos suelen ser otra edición.
  const released = yearOf(rg['first-release-date'])
  if (Number.isFinite(released)) {
    if (released > chartYear + 1) return -1
    // Un año de margen por fechas imprecisas en MusicBrainz, pero penalizado frente a una fecha coherente.
    if (released === chartYear + 1) points -= 3
    else points += released >= chartYear - 3 ? 2 : 0
  }
  return points
}

async function resolve(entry, chartYear) {
  const title = cleanTitle(entry.title)
  const queries = VARIOUS.test(entry.artist)
    ? [
        `releasegroup:${quote(title)} AND secondarytype:soundtrack`,
        `releasegroup:${quote(title)}`,
        `releasegroup:(${words(title)}) AND secondarytype:soundtrack`,
      ]
    : [
        `releasegroup:${quote(title)} AND artistname:${quote(entry.artist)}`,
        `releasegroup:${quote(title)} AND artist:(${words(entry.artist)})`,
        // Último recurso para erratas de la fuente: palabras sueltas del título + artista exacto.
        `releasegroup:(${words(title)}) AND artistname:${quote(entry.artist)}`,
      ]

  for (const query of queries) {
    const candidates = await searchReleaseGroups(query)
    const ranked = candidates
      .map((rg) => ({ rg, points: score(rg, entry, chartYear) }))
      .filter((c) => c.points >= 0)
      .sort((a, b) => b.points - a.points)
    const best = ranked[0]
    if (best) {
      const rg = best.rg
      return {
        id: rg.id,
        title: rg.title,
        artist: credit(rg),
        artists: (rg['artist-credit'] ?? []).flatMap((c) => (c.artist ? [{ id: c.artist.id, name: c.artist.name }] : [])),
        firstReleaseDate: rg['first-release-date'] || undefined,
        primaryType: rg['primary-type'] ?? undefined,
        secondaryTypes: rg['secondary-types']?.length ? rg['secondary-types'] : undefined,
      }
    }
  }
  return null
}

// ---------------------------------------------------------------- proceso

const years = Object.keys(charts.years).map(Number).sort((a, b) => a - b)
const total = years.reduce((n, y) => n + charts.years[y].length, 0)
let done = 0
let matched = 0

for (const year of years) {
  for (const entry of charts.years[year]) {
    const key = `${year}-${entry.rank}`
    if (!(key in cache) || (RETRY_UNMATCHED && cache[key] === null)) {
      cache[key] = await resolve(entry, year)
      writeFileSync(CACHE, JSON.stringify(cache, null, 1) + '\n')
    }
    done++
    if (cache[key]) matched++
    console.log(`[${done}/${total}] ${year} nº${entry.rank} ${entry.title} — ${entry.artist} → ${cache[key] ? cache[key].title : 'SIN COINCIDENCIA'}`)
  }
}

// ---------------------------------------------------------------- correcciones manuales

const OVERRIDES = join(ROOT, 'scripts/data/mb-overrides.json')
const toMatch = (rg) => ({
  id: rg.id,
  title: rg.title,
  artist: credit(rg),
  artists: (rg['artist-credit'] ?? []).flatMap((c) => (c.artist ? [{ id: c.artist.id, name: c.artist.name }] : [])),
  firstReleaseDate: rg['first-release-date'] || undefined,
  primaryType: rg['primary-type'] ?? undefined,
  secondaryTypes: rg['secondary-types']?.length ? rg['secondary-types'] : undefined,
})

if (existsSync(OVERRIDES)) {
  const { overrides } = JSON.parse(readFileSync(OVERRIDES, 'utf8'))
  for (const [key, { mbid }] of Object.entries(overrides)) {
    if (mbid === null) cache[key] = null
    else if (cache[key]?.id !== mbid) {
      const wait = lastRequest + MIN_INTERVAL_MS - Date.now()
      if (wait > 0) await sleep(wait)
      lastRequest = Date.now()
      const response = await fetch(`https://musicbrainz.org/ws/2/release-group/${mbid}?fmt=json&inc=artist-credits`, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      })
      if (!response.ok) throw new Error(`Corrección ${key}: MusicBrainz ${response.status} para ${mbid}`)
      cache[key] = toMatch(await response.json())
      console.log(`corrección ${key} → ${cache[key].title} · ${cache[key].artist}`)
    }
  }
  writeFileSync(CACHE, JSON.stringify(cache, null, 1) + '\n')
  matched = Object.values(cache).filter(Boolean).length
}

const catalog = {
  source: charts.source,
  sourceUrlPattern: charts.sourceUrlPattern,
  /** Años cuya lista procede de otra fuente (y su enlace). */
  yearSources,
  generatedAt: new Date().toISOString(),
  entries: years.flatMap((year) =>
    charts.years[year].map((entry) => ({
      year,
      rank: entry.rank,
      chartTitle: entry.title,
      chartArtist: entry.artist,
      album: cache[`${year}-${entry.rank}`] ?? null,
    })),
  ),
}
mkdirSync(dirname(OUTPUT), { recursive: true })
writeFileSync(OUTPUT, JSON.stringify(catalog) + '\n')
console.log(`\nListo: ${matched}/${total} discos localizados en MusicBrainz → ${OUTPUT}`)
