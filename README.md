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

## La tienda 3D

La portada (`/`) es una tienda de discos en 3D a pantalla completa (three.js + React Three Fiber,
`src/components/store3d/`), con pantalla de entrada: un pasillo con un mueble por década, carteles pintados y etiquetas
de año en las baldas. La misma selección en lista está en `/estanterias`. Se camina con WASD/flechas, se mira arrastrando y
la rueda avanza; en móvil, arrastrar y los botones ▲ ▼.

Al pulsar una portada **se coge el disco**: sale de la balda y queda en la mano, se gira arrastrando y se le da la vuelta
(botón o tecla F). El reverso es la contraportada original si Cover Art Archive la tiene; si no, se compone con la lista
de canciones, sello y fecha de la edición en MusicBrainz (`src/services/albumBack.ts`). Debajo, una cartela con la demo,
los enlaces, la estrella de favoritos y «Ficha completa». Mientras suena la demo, el vinilo asoma de la funda y gira.
Esc lo devuelve a su hueco.

La tienda tiene además (`src/components/store3d/Decor.tsx`): un mostrador al fondo con **tocadiscos** («Ponerlo en el
tocadiscos» lleva el disco hasta el plato y lo pone a sonar), una **gramola** en la entrada que elige un nº 1 al azar,
**cubetas** con los nº 1 de cada año (también se pueden coger), **pósters** con el nº 1 más duradero de cada década,
altavoces, un neón y una alfombra con forma de vinilo.

## Favoritos

La estrella de cada disco lo guarda en `/favoritos`. De momento son temporales: viven en memoria y se borran al recargar
la página (`src/components/favorites/`). Con cuentas de usuario (Supabase) pasarán a guardarse.

- three.js se descarga aparte (carga diferida) y la escena se pausa fuera de pantalla.
- Las portadas de la tienda salen de 8 imágenes (una por década, `public/atlas/`) que se generan con
  `node scripts/build-cover-atlas.mjs` tras actualizar el catálogo. Son miniaturas de 128 px de Cover Art Archive;
  la ficha y la vista en lista siguen pidiendo las portadas grandes a Cover Art Archive.
- Sin WebGL se muestra un aviso, y debajo siempre están las mismas estanterías en lista.

## Escuchar y comprar

Cada ficha enlaza a Apple Music, Spotify, Tidal, SoundCloud y Amazon (`src/services/listen/listenLinks.ts`):

- **Apple Music**: enlace directo al álbum, verificado con la iTunes Search API (mismo criterio artista + título).
- **Spotify, Tidal, SoundCloud y Amazon.com**: búsqueda del disco en cada servicio (marcada con ⌕). Para enlaces directos
  haría falta una API con clave (p. ej. Odesli/song.link, que ya no funciona sin ella) o un backend propio.
- Logos: [Simple Icons](https://simpleicons.org) (CC0). Amazon no está disponible allí: se usa un carrito genérico.

## Catálogo de la tienda: Top 10 anual de Billboard

La tienda muestra, en una estantería por década, los 10 álbumes más vendidos de cada año en EE. UU. según las listas
anuales de Billboard (desde 1956, el primer año con lista de álbumes). El catálogo se genera con dos scripts y se
guarda en el repositorio, así que la web no hace ninguna petición para montarlo (solo para las portadas):

```bash
node scripts/fetch-billboard-charts.mjs              # listas → scripts/data/billboard-year-end.json (1 página cada 10 s)
node scripts/resolve-chart-albums.mjs                # MusicBrainz → src/data/charts/billboardTop10.json (1 petición/s)
node scripts/resolve-chart-albums.mjs --retry-unmatched   # reintenta los discos sin coincidencia
```

- `scripts/data/billboard-supplement.json`: años que la fuente no publica (1961, 1962, 2023–2025); solo el nº 1, de Wikipedia.
- `scripts/data/mb-overrides.json`: correcciones revisadas a mano (erratas de la fuente, títulos que son símbolos como «÷»,
  bandas sonoras confundidas con la partitura…), cada una con su motivo.

- Fuente de las listas: [bestsellingalbums.org](https://bestsellingalbums.org), que recopila los *Year-End* de Billboard
  (billboard.com no permite el acceso automatizado). Antes de 1992 Billboard elaboraba la lista con encuestas a tiendas,
  no con ventas contabilizadas, y algunos años antiguos solo publicaron 5 discos.
- Cada disco solo se asocia a un MBID si coinciden título y artista. Los que no tienen coincidencia segura se muestran
  igualmente, con su título y artista de la lista, placeholder y la nota «No localizado en MusicBrainz».
- Ambos scripts guardan su progreso: si se interrumpen, al relanzarlos continúan.

## Sin Supabase

Si `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY` están vacías, la tienda funciona igual pero sin cuentas: favoritos y
colección quedan pendientes y un aviso lo indica.

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

Rutas: `/` (tienda 3D), `/estanterias` (lista), `/favoritos`, `/buscar?q=&tipo=artistas|ediciones&page=`, `/artista/:mbid`, `/estanteria/:id`.
