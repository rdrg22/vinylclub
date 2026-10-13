/**
 * Descarga las listas anuales de álbumes de Billboard (Top 10 de cada año)
 * desde bestsellingalbums.org, que las recopila citando a Billboard como fuente.
 *
 * - Respeta el `Crawl-delay: 10` de su robots.txt (una página cada 10 s).
 * - Guarda el progreso tras cada año: si se interrumpe, al relanzarlo continúa.
 *
 * Uso: node scripts/fetch-billboard-charts.mjs
 * Salida: scripts/data/billboard-year-end.json
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const FIRST_YEAR = 1956 // primer año con lista anual de álbumes de Billboard
const LAST_YEAR = new Date().getFullYear() - 1
const TOP = 10
const DELAY_MS = 10_000
const USER_AGENT = 'VinylClub/0.1.0 ( https://github.com/rdrg22/vinylclub )'
const pageUrl = (year) => `https://bestsellingalbums.org/year-end/Billboard_Top_Albums_${year}`

const out = join(dirname(fileURLToPath(import.meta.url)), 'data', 'billboard-year-end.json')
mkdirSync(dirname(out), { recursive: true })

const data = existsSync(out)
  ? JSON.parse(readFileSync(out, 'utf8'))
  : {
      source: 'Billboard Year-End Top Albums (Billboard 200), vía bestsellingalbums.org',
      sourceUrlPattern: pageUrl('{year}'),
      fetchedAt: null,
      years: {},
      missing: [],
    }

const decodeOnce = (text) =>
  text
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

/** Algunas celdas vienen doblemente codificadas («&amp;amp;»): se decodifica hasta que no cambie. */
function decodeEntities(text) {
  let current = text
  for (let previous; previous !== current; ) [previous, current] = [current, decodeOnce(current)]
  return current
}

const decode = (text) => decodeEntities(text.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()

function parseTable(html) {
  const rows = []
  for (const [, row] of html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const cells = [...row.matchAll(/<td>([\s\S]*?)<\/td>/g)].map(([, cell]) => decode(cell))
    if (cells.length >= 4 && /^\d+$/.test(cells[0])) {
      rows.push({ rank: Number(cells[0]), artist: cells[1], title: cells[2], released: cells[3] || null })
    }
  }
  return rows.sort((a, b) => a.rank - b.rank).slice(0, TOP)
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let first = true
for (let year = FIRST_YEAR; year <= LAST_YEAR; year++) {
  if (data.years[year] || data.missing.includes(year)) continue
  if (!first) await sleep(DELAY_MS)
  first = false

  const response = await fetch(pageUrl(year), { headers: { 'User-Agent': USER_AGENT } })
  if (response.status === 404) {
    data.missing.push(year)
    console.log(`${year}: no publicado`)
  } else if (!response.ok) {
    console.error(`${year}: error HTTP ${response.status}; se reintentará en la próxima ejecución`)
    continue
  } else {
    const rows = parseTable(await response.text())
    if (rows.length === 0) {
      console.error(`${year}: página sin tabla reconocible; se reintentará en la próxima ejecución`)
      continue
    }
    data.years[year] = rows
    console.log(`${year}: ${rows.length} discos · nº1 ${rows[0].title} — ${rows[0].artist}`)
  }
  data.fetchedAt = new Date().toISOString()
  writeFileSync(out, JSON.stringify(data, null, 2) + '\n')
}

console.log(`Listo: ${Object.keys(data.years).length} años en ${out}`)
