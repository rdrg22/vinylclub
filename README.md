# Vinyl Club

Tienda de discos personalizable: cada usuario monta sus propias estanterías por décadas, géneros, estilos y tipos de lanzamiento.

## Puesta en marcha

```bash
npm install
cp .env.example .env   # opcional: sin credenciales arranca en modo demostración
npm run dev
```

- `npm run build` — comprobación de tipos y build de producción.
- `npm run typecheck` — solo TypeScript.
- `npm test` — pruebas (Vitest). No llaman a ninguna API real.

## Modo demostración

Si `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY` están vacías, la app usa un catálogo de ejemplo escrito a mano
(`src/data/demo/demoCatalog.ts`). Esos discos no proceden de MusicBrainz, no tienen MBID ni portada, y la interfaz
los marca siempre como datos de ejemplo.

## MusicBrainz y Cover Art Archive

No hace falta clave ni registro. Toda la integración vive en `src/services/musicbrainz/`:

- `client.ts` — cola única (≥ 1,1 s entre peticiones), caché en memoria de 1 h, peticiones idénticas compartidas,
  cancelación de las que ya no hacen falta y reintentos ante 503.
- `musicbrainz.ts` — búsqueda de discos, artistas y ediciones; ficha de disco; discografía; estanterías.
- `normalize.ts` — traduce las respuestas a los tipos de `src/types/music.ts`.
- `shelfQuery.ts` — filtros de estantería → consulta Lucene. Lo que MusicBrainz no puede resolver
  (colecciones editoriales, «joyas ocultas», «artistas emergentes») se devuelve como *no aplicado*.

Las portadas (`src/services/coverArt.ts`) se piden a `coverartarchive.org/release-group/{MBID}/front-{250|500}`;
si no existen, se muestra el placeholder.

**User-Agent:** se envía `VinylClub/<versión> ( <VITE_MUSICBRAINZ_CONTACT> )`. Chrome y Safari no permiten que una web
cambie ese encabezado y lo descartan; Firefox sí lo envía. Para garantizarlo siempre haría falta un proxy propio.

## Demos de audio

Cada disco puede reproducir un fragmento de 30 s de una de sus pistas, obtenido de la
[iTunes Search API](https://performance-partners.apple.com/search-api) (pública, sin clave). Solo se consulta al pulsar
«escuchar», los resultados se cachean y solo se acepta una pista si artista y álbum coinciden; si no, se muestra
«Sin demo disponible». Ver `src/services/previews/itunesPreviews.ts`.

## Estructura

```
src/
  components/   UI por dominio: layout, album, shelf, discovery, search, ui
  pages/        Una página por ruta
  hooks/        Estado de datos para la UI (useAlbums: búsquedas y fichas; useShelves: estanterías)
  services/     APIs externas: musicbrainz/, coverArt.ts, previews/ (demos de audio)
  config/       Entorno y catálogo de filtros (verificables vs. editoriales)
  data/demo/    Datos de ejemplo del modo demostración
  types/        Modelo común: Album, Shelf, ShelfFilters
  utils/        Funciones puras (resumen de filtros, hash, clases)
```

Rutas: `/` (Mi tienda), `/buscar?q=&tipo=artistas|ediciones&page=`, `/artista/:mbid`, `/estanteria/:id`, `/estanterias/nueva`, `/coleccion?tab=favoritos|coleccion`.
