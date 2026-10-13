# Mejoras pendientes

Revisión de la web publicada (13-10-2026). Se abordan de una en una, en este orden.

| # | Prioridad | Problema | Solución propuesta | Esfuerzo | Estado |
|---|-----------|----------|--------------------|----------|--------|
| 1 | ~~🔴 Crítica~~ | ~~Portadas descargadas que se quedan invisibles~~ | Falso positivo: el navegador de pruebas estaba oculto y congelaba las transiciones CSS. Verificado: 12/12 portadas correctas en local y en Netlify | — | ✅ Descartado |
| 2 | 🟠 Alta | Portadas muy lentas (media 7,7 s, picos de 18 s): la tienda 3D se ve llena de rectángulos de colores | Una imagen por década con todas sus miniaturas (`scripts/build-cover-atlas.mjs`), servida desde la web: 8 descargas de ~50 ms en vez de 600+ | Medio | ✅ Hecho |
| 3 | 🟠 Alta | La tienda no es lo primero que se ve (empieza a 300 px en escritorio y a 458 px en móvil) | La portada es la tienda a pantalla completa con pantalla de entrada tipo juego; la lista pasa a `/estanterias` | Medio-bajo | ✅ Hecho |
| 4 | 🟡 Media | «Nueva estantería» y «Colección» llevan a páginas «en construcción» | Ocultarlos hasta las fases 3 y 4 | Bajo | Pendiente |
| 5 | 🟡 Media | Estanterías que parecen vacías (años 50: 16 discos en 100 huecos) | Muebles a medida de cada década | Medio | Pendiente |
| 6 | 🟡 Media | Rendimiento en móvil sin medir (8 luces, 600+ texturas sueltas) | Tras el punto 2: menos luces, geometría instanciada y medir en un móvil real | Medio | Pendiente |
| 7 | 🟢 Baja | Pasillo vacío y repetitivo | Cubetas centrales, mostrador, pósters de los nº 1, cartel «Elegido para ti» | Alto | Pendiente |

El punto 6 depende del 2: la imagen por década ya reduce mucho el coste de la escena. Los 16 fps medidos en la
revisión no son fiables (mismo navegador oculto, que ralentiza el render): hay que medir en un dispositivo real.
