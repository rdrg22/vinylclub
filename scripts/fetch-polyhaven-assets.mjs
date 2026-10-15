/**
 * Descarga las texturas PBR y la iluminación HDRI de la tienda 3D desde Poly Haven
 * (https://polyhaven.com, licencia CC0: uso libre, sin atribución obligatoria).
 *
 * - Resolución 1k: suficiente para una escena web y ligera de descargar.
 * - Si un archivo ya existe no se vuelve a descargar.
 *
 * Uso: node scripts/fetch-polyhaven-assets.mjs
 * Salida: public/textures/<id>/{color,normal,rough}.jpg y public/hdri/<id>.hdr
 */
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const USER_AGENT = 'VinylClub/0.1.0 ( https://github.com/rdrg22/vinylclub )'
const RES = '1k'

/** Texturas: id de Poly Haven → uso en la tienda. */
export const TEXTURES = {
  wood_floor_worn: 'suelo',
  dark_wood: 'muebles y mostrador',
  wood_table_worn: 'cubetas',
  beige_wall_001: 'paredes',
  plastered_wall: 'techo',
}
export const HDRI = 'brown_photostudio_02'

/** Mapas que se usan y su nombre en la API de Poly Haven. */
const MAPS = { color: 'Diffuse', normal: 'nor_gl', rough: 'Rough' }

const api = async (path) => {
  const response = await fetch(`https://api.polyhaven.com/${path}`, { headers: { 'User-Agent': USER_AGENT } })
  if (!response.ok) throw new Error(`API ${response.status} en ${path}`)
  return response.json()
}

async function download(url, file) {
  if (existsSync(file)) return statSync(file).size
  mkdirSync(dirname(file), { recursive: true })
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!response.ok) throw new Error(`HTTP ${response.status} al descargar ${url}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  writeFileSync(file, buffer)
  return buffer.length
}

let total = 0
for (const [id, use] of Object.entries(TEXTURES)) {
  const files = await api(`files/${id}`)
  for (const [name, key] of Object.entries(MAPS)) {
    const url = files[key]?.[RES]?.jpg?.url
    if (!url) throw new Error(`${id}: no hay mapa ${key} en ${RES}`)
    const size = await download(url, join(ROOT, 'public/textures', id, `${name}.jpg`))
    total += size
    console.log(`${id} (${use}) · ${name}: ${(size / 1024).toFixed(0)} KB`)
  }
}

const hdriFiles = await api(`files/${HDRI}`)
const hdriUrl = hdriFiles.hdri?.[RES]?.hdr?.url
if (!hdriUrl) throw new Error(`${HDRI}: no hay HDRI en ${RES}`)
const hdriSize = await download(hdriUrl, join(ROOT, 'public/hdri', `${HDRI}.hdr`))
total += hdriSize
console.log(`${HDRI} (iluminación): ${(hdriSize / 1024).toFixed(0)} KB`)

writeFileSync(
  join(ROOT, 'public/textures/CREDITS.md'),
  `# Texturas e iluminación\n\nDe [Poly Haven](https://polyhaven.com), licencia [CC0](https://polyhaven.com/license).\n\n` +
    Object.entries(TEXTURES)
      .map(([id, use]) => `- [${id}](https://polyhaven.com/a/${id}) — ${use}`)
      .join('\n') +
    `\n- [${HDRI}](https://polyhaven.com/a/${HDRI}) — iluminación (HDRI)\n`,
)
console.log(`Total: ${(total / 1024 / 1024).toFixed(1)} MB`)
