/**
 * Genera una imagen por década con todas sus portadas en miniatura (atlas) para la
 * tienda 3D: 8 descargas desde la propia web en vez de 600+ a Cover Art Archive.
 *
 * - Descarga cada portada (front-250) una sola vez y la guarda en scripts/.cache/covers.
 * - Los discos sin portada (404) quedan fuera del atlas y la tienda usa su funda tipográfica.
 * - Salida: public/atlas/<década>.webp + src/data/charts/coverAtlas.json (posición de cada disco).
 *
 * Uso: node scripts/build-cover-atlas.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CATALOG = join(ROOT, 'src/data/charts/billboardTop10.json')
const CACHE_DIR = join(ROOT, 'scripts/.cache/covers')
const MISSING = join(CACHE_DIR, 'missing.json')
const OUT_DIR = join(ROOT, 'public/atlas')
const OUT_MAP = join(ROOT, 'src/data/charts/coverAtlas.json')

export const CELL = 128
export const COLS = 10
const CONCURRENCY = 4
const USER_AGENT = 'VinylClub/0.1.0 ( https://github.com/rdrg22/vinylclub )'

mkdirSync(CACHE_DIR, { recursive: true })
mkdirSync(OUT_DIR, { recursive: true })
const missing = new Set(existsSync(MISSING) ? JSON.parse(readFileSync(MISSING, 'utf8')) : [])

// Mismo criterio que la app: cada disco una vez, en el primer año que entró en la lista.
const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'))
const byDecade = new Map()
const seen = new Set()
for (const entry of [...catalog.entries].sort((a, b) => a.year - b.year || a.rank - b.rank)) {
  if (!entry.album || seen.has(entry.album.id)) continue
  seen.add(entry.album.id)
  const decade = `${Math.floor(entry.year / 10) * 10}s`
  byDecade.set(decade, [...(byDecade.get(decade) ?? []), entry.album.id])
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function download(id) {
  const file = join(CACHE_DIR, `${id}.jpg`)
  if (existsSync(file)) return file
  if (missing.has(id)) return null
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(`https://coverartarchive.org/release-group/${id}/front-250`, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(30_000),
      })
      if (response.status === 404) {
        missing.add(id)
        return null
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      writeFileSync(file, Buffer.from(await response.arrayBuffer()))
      return file
    } catch (error) {
      if (attempt === 2) {
        console.error(`  ${id}: ${error.message} (se reintentará en la próxima ejecución)`)
        return null
      }
      await sleep(2000 * (attempt + 1))
    }
  }
  return null
}

/** Descarga con concurrencia limitada para no saturar Cover Art Archive. */
async function downloadAll(ids) {
  const results = new Map()
  let next = 0
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < ids.length) {
        const id = ids[next++]
        results.set(id, await download(id))
      }
    }),
  )
  return results
}

const map = { cell: CELL, cols: COLS, generatedAt: new Date().toISOString(), decades: {}, covers: {} }

for (const [decade, ids] of byDecade) {
  const files = await downloadAll(ids)
  const present = ids.filter((id) => files.get(id))
  const rows = Math.max(1, Math.ceil(present.length / COLS))
  const tiles = await Promise.all(
    present.map(async (id, index) => ({
      input: await sharp(files.get(id)).resize(CELL, CELL, { fit: 'cover' }).toBuffer(),
      left: (index % COLS) * CELL,
      top: Math.floor(index / COLS) * CELL,
    })),
  )
  const file = `atlas/${decade}.webp`
  await sharp({ create: { width: COLS * CELL, height: rows * CELL, channels: 3, background: '#2a1d13' } })
    .composite(tiles)
    .webp({ quality: 80 })
    .toFile(join(ROOT, 'public', file))

  map.decades[decade] = { file, rows, count: present.length }
  present.forEach((id, index) => (map.covers[id] = [decade, index]))
  console.log(`${decade}: ${present.length}/${ids.length} portadas → public/${file}`)
}

writeFileSync(MISSING, JSON.stringify([...missing], null, 1) + '\n')
writeFileSync(OUT_MAP, JSON.stringify(map) + '\n')
console.log(`Listo: ${Object.keys(map.covers).length} portadas en ${byDecade.size} atlas · ${missing.size} discos sin portada`)
