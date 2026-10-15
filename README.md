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
de año en las baldas. No se camina libremente: se va de un sitio a otro pulsando las **marcas translúcidas del suelo**
(`FloorSpots.tsx`, sitios en `spots.ts`: entrada, gramola, cubetas, cada estantería, la Colección y el mostrador) o los
botones de abajo; arrastrando se mira alrededor.

Todo ocurre dentro de la tienda: no hay otras páginas. El menú de arriba abre ventanas con el estilo de las cartelas
(`StoreWindow.tsx`): **Buscar** (discos de la tienda al instante y de MusicBrainz; el elegido aparece delante y se coge
como los de la balda), **Favoritos**, **Entrar / Tu perfil** (cuenta) y **Ajustes** (calidad gráfica, pantalla completa, rendimiento). Abajo, los
botones de cada década y de la Colección. Cualquier otra dirección redirige a `/`.

Al pulsar una portada **se coge el disco**: sale de la balda y queda en la mano, se gira arrastrando y se le da la vuelta
(botón o tecla F). El reverso es la contraportada original si Cover Art Archive la tiene; si no, se compone con la lista
de canciones, sello y fecha de la edición en MusicBrainz (`src/services/albumBack.ts`). Debajo, una cartela con la demo,
los enlaces, la estrella de favoritos y «Ficha completa». Mientras suena la demo, el vinilo asoma de la funda y gira.
Esc lo devuelve a su hueco.

La tienda tiene además (`src/components/store3d/Decor.tsx`): un mostrador al fondo con **tocadiscos** («Ponerlo en el
tocadiscos» lleva el disco hasta el plato y lo pone a sonar), una **gramola** en la entrada que elige un nº 1 al azar,
**cubetas** con los nº 1 de cada año (también se pueden coger), **pósters** con el nº 1 más duradero de cada década,
altavoces, un neón y una alfombra con forma de vinilo. La gramola tiene una pantalla CRT pixel-art
(`jukeboxScreen.ts`, fuente Press Start 2P) con selector, marquesina, ecualizador animado y la barra de progreso real de
la demo. En el mostrador del DJ hay guiños de cultura pop genéricos, sin personajes ni marcas registradas
(`CounterToys.tsx`): robot de hojalata y astronauta que cabecean al ritmo, bola de discoteca, lámpara de lava, cubo de
colores, casete con lápiz, consola portátil y cascos.

## Favoritos

La estrella de cada disco lo guarda en la ventana **Favoritos**. De momento son temporales: viven en memoria y se borran al recargar
la página (`src/components/favorites/`).

## Cuentas y «Mi colección»

Con una cuenta (Firebase Auth: **Google** o email y contraseña; ventana **Entrar** del menú) cada visitante registra los discos que
tiene en casa pulsando el hueco **«+»** de la estantería «Colección», al fondo de la tienda:

- **Por código de barras**: se escribe el número de la funda (se aceptan espacios y guiones; UPC-A de 12 cifras y
  EAN-13 se prueban como equivalentes) o se **escanea con la cámara** donde el navegador tiene `BarcodeDetector`
  (Chrome en Android, sobre todo). La cámara solo funciona en https o en `localhost`.
- **Por título o artista**: «Pink Floyd The Wall».

En ambos casos se busca en MusicBrainz y el usuario elige su **edición exacta** (los vinilos salen primero). Cada disco
guardado es un documento `users/{uid}/collection/{MBID de la edición}` en Firestore. Las reglas
(`firestore.rules`) solo dejan a cada usuario leer, añadir y quitar lo suyo, validan los campos y no permiten la misma
edición dos veces.

En la tienda 3D, al fondo junto al DJ, aparece el mueble **«Colección»** con tus discos (portadas reales de Cover Art
Archive): se cogen, se les da la vuelta y suena su demo como en el resto de la tienda. Con uno de tus discos en la mano
aparece «Quitar de mi colección».

### Configurar Firebase

1. En la [consola de Firebase](https://console.firebase.google.com) crea un proyecto y, en *Configuración del
   proyecto → Tus apps*, añade una **app web** (`</>`). Copia los valores de `firebaseConfig`.
2. **Authentication → Comenzar → Método de acceso**: habilita **Correo electrónico/contraseña** y **Google** (este pide
   elegir un email de asistencia).
   `localhost` ya está en *Settings → Dominios autorizados*; si publicas la web, añade su dominio ahí.
3. **Firestore Database → Crear base de datos** (modo producción, ubicación `eur3` u otra cercana).
   En la pestaña **Reglas**, pega el contenido de `firestore.rules` y pulsa **Publicar**.
4. Crea `.env.local` en la raíz (no se sube a git) con los valores del paso 1:

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=tu-proyecto
   VITE_FIREBASE_APP_ID=1:...:web:...
   ```

   Son identificadores públicos de la app web, no secretos: lo que protege los datos son las reglas de Firestore.
5. Reinicia `npm run dev`.

- three.js se descarga aparte (carga diferida) y la escena se pausa fuera de pantalla.
- Las portadas de la tienda salen de 8 imágenes (una por década, `public/atlas/`) que se generan con
  `node scripts/build-cover-atlas.mjs` tras actualizar el catálogo. Son miniaturas de 128 px de Cover Art Archive;
  la ficha y la vista en lista siguen pidiendo las portadas grandes a Cover Art Archive.
- Sin WebGL se muestra un aviso, y debajo siempre están las mismas estanterías en lista.

### Aspecto realista

- Texturas fotográficas PBR (color, relieve y rugosidad) e iluminación HDRI de [Poly Haven](https://polyhaven.com)
  (CC0), en `public/textures` y `public/hdri`. Se descargan con `node scripts/fetch-polyhaven-assets.mjs`; los créditos
  están en `public/textures/CREDITS.md`.
- Calidad gráfica en tres niveles (`src/components/store3d/quality.ts`, tabla `QUALITY`): «ligera» (solo color y luz
  básica), «media» (texturas con relieve y sombras) y «alta» (además oclusión ambiental, brillo de bombillas y neones,
  viñeta y grano, `Lighting.tsx`). La tienda **siempre arranca en media**; se cambia en **Ajustes** y dura la visita.
  Si el equipo no llega a 45 fps, se baja sola la resolución de render dentro de la calidad elegida.
- Ajustes (`SettingsWindow.tsx`): calidad, pantalla completa y mostrar rendimiento (fps). Cada ajuste es una sección
  `<Setting>`: añadir uno nuevo es añadir otra.

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

## Sin Firebase (modo demostración)

Si falta alguna variable `VITE_FIREBASE_*`, la tienda funciona igual pero sin cuentas: un aviso lo indica, los favoritos
se borran al recargar y «Mi colección» se guarda solo en este navegador (`localStorage`).

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

Ruta única: `/` (tienda 3D).
