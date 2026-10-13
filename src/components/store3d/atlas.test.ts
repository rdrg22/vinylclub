import { describe, expect, it } from 'vitest'
import raw from '@/data/charts/coverAtlas.json'
import { CHART_ALBUMS } from '@/data/charts/chartCatalog'
import { atlasUV } from './atlas'

const atlas = raw as unknown as { cell: number; cols: number; decades: Record<string, { rows: number; count: number }>; covers: Record<string, [string, number]> }

describe('atlas de portadas', () => {
  it('todas las coordenadas caen dentro de la textura y sin solaparse', () => {
    for (const id of Object.keys(atlas.covers)) {
      const uv = atlasUV(id)
      expect(uv).not.toBeNull()
      const [u0, v0, u1, v1] = uv!
      for (const value of uv!) expect(value).toBeGreaterThanOrEqual(0)
      for (const value of uv!) expect(value).toBeLessThanOrEqual(1)
      expect(u1).toBeGreaterThan(u0)
      expect(v1).toBeGreaterThan(v0)
    }
  })

  it('cada década declara tantas portadas como discos tiene en el mapa', () => {
    for (const [decade, entry] of Object.entries(atlas.decades)) {
      const inDecade = Object.values(atlas.covers).filter(([d]) => d === decade)
      expect(inDecade).toHaveLength(entry.count)
      expect(entry.rows).toBe(Math.max(1, Math.ceil(entry.count / atlas.cols)))
    }
  })

  it('solo contiene discos del catálogo y los no localizados no tienen portada', () => {
    const ids = new Set(CHART_ALBUMS.map((a) => a.id))
    for (const id of Object.keys(atlas.covers)) expect(ids.has(id)).toBe(true)
    for (const album of CHART_ALBUMS.filter((a) => a.source === 'chart')) expect(atlasUV(album.id)).toBeNull()
  })

  it('la primera portada ocupa la esquina superior izquierda', () => {
    const first = Object.entries(atlas.covers).find(([, [, index]]) => index === 0)!
    const [u0, , , v1] = atlasUV(first[0])!
    expect(u0).toBeLessThan(0.01)
    expect(v1).toBeGreaterThan(0.95)
  })
})
