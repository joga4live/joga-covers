# Revisión v4 — joga-covers, 6 sep 2026 (Nico) — cuarta vuelta (franja negra abajo)

## Veredicto: **APROBADO**

El defecto está arreglado y **medido en navegador real**, con prueba de control antes de creerme
ningún resultado. No encontré ningún defecto nuevo. Cero cambios de layout no pedidos. Los 12
«Acepta» de las vueltas 1-3 siguen pasando.

Se puede comitear y publicar.

**Auditado**: `app.js` (working tree, sin comitear) y
`.joga/handoff/implementacion-joga-covers-6sep.md`, sección «Ronda 4 — fondo de imagen centrado».
`git status` → exactamente esos dos archivos y nada más. No hay archivos de la otra sesión en el
árbol, así que no había nada ajeno que esquivar.

---

## Cómo lo medí (y por qué te puedes fiar del número)

**El arnés se validó primero contra el código viejo.** Copié el árbol a un directorio temporal
fuera del repo, dos veces: `after/` con el `app.js` del working tree (verificado
**byte a byte**, sha256 `1f8daa23…a328f` idéntico al del repo) y `before/` con el `app.js` de
`HEAD`. Mismo `index.html` en los tres sitios (sha256 `95412c6f…b47a`). Servidor `python3
-m http.server` levantado **desde el scratchpad**, nada escrito dentro del repo — no creé
`.claude/launch.json` ni ningún otro archivo en `joga-covers`.

Condiciones fijadas antes de medir geometría, por las trampas de hoy:
- viewport **1440×900** fijo,
- **`document.fonts.ready`** esperado en cada pasada,
- idioma fijado: `<html lang="es">` en las dos pasadas (la regresión falsa de layout de una vuelta
  anterior vino de comparar una pasada en inglés contra otra en español),
- pestaña visible, no oculta.

**Prueba de control (sin esto ningún «PASA» de abajo vale).** Con el `app.js` de `HEAD`, el arnés
reprodujo el defecto exacto que describió Kimo MD:

| medición | control (`HEAD`) | esperado por Kimo MD |
|---|---|---|
| `state.bgObject.top` | **450** | 450 ✔ |
| `originY` | `center` | `center` ✔ |
| `getBoundingRect(true,true)` | **−30 a 930** | −30 a 930 ✔ |
| franja vacía abajo en el PNG 1600×2560 | **80 px** | 80 px ✔ |
| franja vacía arriba | 0 px | — |

Los 80 px se contaron recorriendo columnas enteras del export (`x=8`, `x=40`, `x=1591`): las tres
dieron 80 exactos. El instrumento sí ve la franja. Control válido.

---

## El defecto — **ARREGLADO**

`app.js:761`, `setImageBg()`: `top: 450` → `top: 480`.

**Medido en el build de esta ronda, por las dos vías de entrada:**

| vía | `top` | bbox `top` | bbox `bottom` | franja arriba | franja abajo |
|---|---|---|---|---|---|
| botón «+» (`#uploadBg`) | **480** | **0** | **960** | 0 px | **0 px** |
| arrastrar y soltar sobre `.canvas-area` | **480** | **0** | **960** | 0 px | **0 px** |

PNG de prueba: 1410×2250 (ratio 1.5957, el de la portada real de José), con bandas de color en los
cuatro bordes para poder distinguir «hay imagen» de «no hay nada». Escala aplicada 0.42667, bbox
601.6×960 — el alto encaja exacto y el ancho desborda 1.6 px, que es lo correcto para `cover`.

**Y el arrastrar-y-soltar sí pasa por `setImageBg`, confirmado, no supuesto**: mismo `top`, misma
bbox, y `state.currentBg` quedó en `'custom'` en las dos vías, o sea que también corrió
`marcarFondoPersonalizado()`.

**Export, con clic real en el botón «Descargar PNG»** (intercepté `HTMLAnchorElement.prototype.click`
sin llamar al original, así que **no se descargó ningún archivo a disco**):

- `data:image/png;base64,…`, **1600×2560 exactos**.
- Franja vacía **arriba: 0 px**, **abajo: 0 px**, medido en **cuatro** columnas (`x=8`, `40`, `800`,
  `1591`).
- Píxel de la última fila (`y=2559`): `[0,0,122]` en las cuatro columnas = la banda azul del borde
  inferior de la imagen fuente bajo el overlay 0.52. O sea, en el borde de abajo hay **imagen**,
  no vacío.

**Sobre el color de la «franja negra»**: no era negro puro sino `[12,11,10]` — el
`backgroundColor: '#1a1815'` del lienzo visto a través del overlay. A ojo es negro; lo aclaro
porque un detector de «negro puro» habría dado 0 y me habría hecho cantar un falso PASA. El
detector va contra el color calculado `#1a1815 × (1 − opacidad del overlay)`, no contra `#000`.

**Comprobación visual, no sólo numérica.** Recorté la esquina inferior izquierda del export
(70×140 px reales, ampliada ×2, sin suavizado) con `top:480` y con `top:450`, lado a lado:
izquierda la columna verde llega hasta abajo y la banda azul se apoya en el borde; derecha la
banda azul queda a un tercio de altura y debajo hay un bloque negro sólido. Se ve exactamente lo
que dicen los números. (No usé captura del panel: está a escala 1/6 y a ese tamaño una captura no
decide nada.)

---

## Corrección al diagnóstico: **el fallo era más ancho de lo que dice el encargo**

Kimo MD lo planteó como un problema de «la portada REAL de José subida por el botón +», y Tavo lo
documentó igual. **Medido, afectaba también a los cuatro fondos de ejemplo que vienen con la app.**
Los cuatro PNG de `backgrounds/` son 1024×1536 (ratio 1.5000), y pasan por la misma `setImageBg`:

| fondo | antes (`HEAD`) | ahora |
|---|---|---|
| `example-business` | bbox −30 a 930, hueco 30 px | **0 a 960** ✔ |
| `example-mindfulness` | bbox −30 a 930, hueco 30 px | **0 a 960** ✔ |
| `example-selfhelp` | bbox −30 a 930, hueco 30 px | **0 a 960** ✔ |
| `example-memoir` | bbox −30 a 930, hueco 30 px | **0 a 960** ✔ |

Export de `example-memoir` con el código viejo: **80 px** de franja abajo, igual que con la portada
subida. Es decir: **cualquiera que hubiera abierto la app y elegido uno de los cuatro fondos de
ejemplo se habría llevado la franja negra**, sin necesidad de subir nada. El arreglo es de una
línea pero tapa más de lo que se le pidió. Bien.

Esto no cambia el veredicto; lo anoto porque el reporte de Tavo dice «la portada real de José» y
el alcance real es «todo fondo de imagen».

---

## `setGradientBg` (450 → 480) — **sin regresión, medido**

Este cambio no arreglaba nada (el degradado ya cubría 0-960 porque un gradiente lineal de canvas
extiende el color de los extremos); era coherencia. Lo que había que comprobar es que no
**estropeara** nada. Muestreé los 4 degradados del selector con el overlay a 0, en 8 puntos cada
uno (4 esquinas, 2 bordes a media altura, centro-arriba, centro-abajo), antes y después:

| degradado | ¿alcanza los dos colores? | Δ máx. por canal (antes → después) |
|---|---|---|
| `solid-gold` (Dorado, el de `init()`) | sí: `#f7d478` arriba-dcha, `#b8862c` abajo-izda | **+4/255** (borde izq. medio `#c89a3f`→`#cb9e43`) |
| `solid-cream` (Crema) | sí: `#f5e9d0` / `#d4b884` | **+4/255** |
| `solid-black` (Noir) | sí: `#1a1815` / `#3a3530` | **−2/255** |
| `solid-burgundy` (Burgundy) | sí: `#4a1a1a` / `#8b3a3a` | **−4/255** |

Máximo **4/255 = 1.6 %** en un solo canal, en un solo punto. Imperceptible, y en la dirección
esperada: la recta del gradiente es ahora un 6.7 % más larga, así que la rampa se estira y hay
**menos** zona de color plano recortada en las esquinas — si acaso, algo mejor. Ningún degradado
perdió un extremo, ninguno mostró banda plana ni negro.

Tavo dijo «mi expectativa es que sea imperceptible, pero no lo medí». Medido: la expectativa era
correcta, con número.

**Un dato de continuidad que salió de aquí.** La v3 registró el píxel (60,60) del dorado tras Reset
como `[111,92,48]`. Ahora da `[112,94,50]`. **No es una regresión**: es exactamente el efecto del
cambio 450→480 en el degradado, +1/+2/+2 tras el overlay, coherente con el +3/+3/+3 que medí en
el degradado desnudo. Lo anoto para que nadie lo lea como deriva en una vuelta futura.

---

## No-regresión — las piezas más frágiles, con interacción real

Todos los clics de esta sección son **clics de ratón reales**, verificados con una sonda de
`mousedown` que registra sobre qué elemento aterrizó cada uno (el panel iba a escala 1/6: CSS ≈
frame × 5.967; los dos primeros intentos cayeron 4 px fuera de la pista del slider y los repetí
tras recalibrar — sin la sonda me los habría creído).

| prueba | resultado |
|---|---|
| **N1** — fijar sólo «Espaciado letras» (clic real → 280, `titleStyle = {"charSpacing":280}`) y escribir un título largo de 67 caracteres con **tecleo real** | slider «Tamaño título» **34**, etiqueta **«34»**, objeto real **34**. Espaciado conservado en 280/280. El panel dice la verdad. **PASA** |
| **N2** — precondición con clics reales: «Sombra texto» → **0** (`shadow === null`), «Oscurecer fondo» → **90** (`rgba(0,0,0,0.9)`), píxel (60,60) = `[23,19,10]` — **idéntico byte a byte** al que registró la v3. Luego **clic real en Reset** (aterrizaje confirmado en `resetBtn`) | sombra **6** (`blur:12`, `offsetY:3` = la fórmula `6*2` y `6/2`), overlay **52** (`rgba(0,0,0,0.52)`), plantilla `editorial-gold`, fondo `solid-gold`, tamaño 62, espaciado 20. **PASA** |
| **Arrastre del título** — arrastre real sobre el lienzo | `top` 380 → **483.2**, `titleOverride` guardado con `left/scaleX/scaleY/width`. Después escribí **33 caracteres reales** y `top` siguió en **483.2**. La letra nueva no borra el arrastre. **PASA** |
| **Export 1600×2560** — clic real en «Descargar PNG» | `1600×2560` exactos, nombre `portada-<slug>-<ts>.png`, `data:image/png;base64,…` de 447 610 caracteres. Descarga interceptada: **nada escrito a disco**. **PASA** |
| **Consola al cargar** | 0 errores, 0 rechazos no capturados. |
| **Los 4 fondos de imagen prefijados** | los 4 cubren 0-960 y la miniatura correcta queda `active`. **PASA** |

---

## Las 4 reglas de oro — verificadas por mi cuenta

| regla | resultado |
|---|---|
| **Gate** | `grep -rE "gate\.js\|..."` sobre `*.js` y `*.html` → **ningún resultado**. No hay gate en este repo. No aplica. |
| **Service worker** | `serviceWorker`, `CACHE_NAME`, `CORE_ASSETS` → **ningún resultado**. No hay SW. No aplica. |
| **i18n** | `index.html` y `app.js` no tienen i18n. El único archivo con diccionarios es `amazon-kdp-guide.html`, **que este diff no toca**; comprobé igualmente su paridad: **24 claves `es` / 24 claves `en`, ninguna suelta en ningún lado**, y el `toggleLang()` sigue ahí. |
| **Branding** | el diff no menciona ni una vez `joga`, `logo`, `emblem` ni `brand`. Intacto. |

Extras del checklist:
- **JS válido**: `node --check app.js` limpio. `index.html` **no tiene ningún script inline** (carga
  `app.js` por `src`), así que no hay más JS que validar en los archivos tocados.
- **Llaves de `localStorage`**: no hay `localStorage`, `sessionStorage` ni `indexedDB` en todo el
  proyecto. No hay progreso de usuario que se pueda perder al renombrar nada.
- **Alcance**: sólo `app.js` y el handoff. `git diff --stat` → 14 líneas en `app.js` (11 de ellas
  comentario bilingüe), 3 líneas de código cambiadas. Ni una línea de layout tocada; comparé el
  lado `-` y el `+` de los dos hunks uno por uno.
- **Restos del lienzo viejo**: repetí el grep de Tavo. Fuera de los comentarios nuevos, los únicos
  `900` que quedan son `fontWeight: 900` (5 veces, peso tipográfico) y comentarios históricos; los
  únicos `450` están dentro de los comentarios nuevos. `app.js:173` es un `top: 480` de subtítulo
  de plantilla, texto, ya estaba en `HEAD`, sin relación. `ajustarLienzo()` usa
  `canvas.getWidth()/getHeight()` dinámicos, no literales. **Confirmado: no queda ningún resto.**

---

## Un detalle preexistente que NO es de esta ronda (para que no asuste después)

En el export, las **3 primeras filas** (`y=0,1,2` de 2560) salen menos oscurecidas que el resto:
`248 → 168 → 133 → 122` (a partir de `y=3` ya es el 122 estable). Es el borde antialiaseado del
rectángulo de overlay en `applyOverlay()`, que no cubre del todo la primera fila.

**Lo medí en las dos versiones y es idéntico byte a byte**: `248/168/133/122` en `HEAD` y
`248/168/133/122` con el arreglo. **No es una regresión de esta vuelta.** Son 3 filas de 2560
(0.1 %) en el borde superior, invisible a ojo. No bloquea nada; lo dejo escrito para que la
próxima vez que alguien mida el borde superior sepa que ya estaba.

---

## Recomendación no bloqueante (no cambia el veredicto)

Este bug nació porque el lienzo pasó de 900 a 960 en `29e816b` y dos literales se quedaron atrás.
**El patrón sigue vivo**: hoy hay **7 sitios** con las medidas del lienzo escritas a mano —
`app.js:13` (`height: 960`), `729` y `731` (480/480), `735` (600×960), `753` (600/960), `761` (480),
`782` (600×960), más el `2.667` en `1307` y `1421`. Si el lienzo vuelve a cambiar de tamaño, hay que
acertar en los 7 y no fallar ninguno — que es exactamente lo que falló esta vez.

Sugerencia para una vuelta futura, **no para ésta**: constantes `ANCHO = 600` / `ALTO = 960` (o
`canvas.getWidth()/getHeight()`, como ya hace `ajustarLienzo()`) y el multiplicador derivado
(`1600 / ANCHO`). No lo pido ahora porque tocar 7 sitios en la vuelta que arregla el bug es meter
riesgo nuevo sin necesidad.

---

## Lecciones de esta vuelta

1. **Cuando se cambia una dimensión global, hay que buscar la MITAD, no sólo el número.** El grep
   natural tras pasar de 900 a 960 es «900», y `450` no aparece. **Regla: al cambiar una constante
   de geometría, grepear también su mitad, su doble y la constante derivada (aquí 450, 1800 y el
   multiplicador), no sólo el valor viejo.** Es lo que dejó vivo este bug tres commits.

2. **Un valor centrado y correcto en el objeto puede seguir dejando hueco: hay que mirar la caja,
   no el `top`.** `top: 450` con `originY:'center'` «parece» centrado leyendo el código. Sólo
   `getBoundingRect()` enseña el −30/930. **Regla: para cualquier fondo que deba cubrir el lienzo,
   la aserción es `bbox.top <= 0 && bbox.top + bbox.height >= alto`, nunca «el top es el que toca».**

3. **El alcance real de un bug se mide, no se hereda del reporte.** El encargo decía «la portada
   real de José» y Tavo lo copió; medido, los **4 fondos de ejemplo que vienen con la app** tenían
   la misma franja de 80 px. **Regla: cuando un fallo está en una función compartida, enumerar y
   medir TODAS las entradas de esa función antes de describir el alcance** — aquí `setImageBg`
   tenía 3 vías (botón, drop, miniaturas) y la tercera no la mencionaba nadie.

4. **Un detector de «negro» que busca `#000` miente cuando hay overlay.** La franja era `[12,11,10]`,
   no `[0,0,0]`; mi primer contador dio 0 filas negras y habría firmado un PASA falso. **Regla: el
   color del «vacío» se calcula desde el `backgroundColor` del lienzo por la opacidad del overlay
   vigente, y se compara con tolerancia — nunca contra negro puro.**

5. **Una fila entera es mal testigo cuando hay texto encima.** Mi segundo intento recorría filas
   completas y daba 0 porque el nombre del autor cae en esa zona. **Regla: para medir bandas en los
   bordes, recorrer COLUMNAS en varias `x` (yo usé 4), no filas.**

6. **Con el panel a escala 1/6, un clic «real» no calibrado es un clic inventado.** Mis dos primeros
   clics cayeron 4 px fuera de la pista de un slider de 16 px de alto y no pasó nada — sin sonda
   habría concluido «el slider no responde». **Regla: antes de la primera medición con clics,
   aterrizar un clic de calibración en un elemento grande y leer `clientX/clientY` reales; y dejar
   una sonda de `mousedown` puesta que diga sobre qué elemento cayó cada clic posterior.** Sirvió
   dos veces hoy.

7. **La prueba de control debe correr contra el código VIEJO, no sólo contra un caso conocido.**
   Servir `HEAD` en paralelo (copia fuera del repo, hash verificado) convirtió «creo que mide bien»
   en «reproduce 450 / −30 / 930 / 80 px, los cuatro números que predijo Kimo MD». **Regla: cuando
   existe un «antes» reproducible, el control es el «antes», y se monta copiando el árbol al
   scratchpad — nunca con `git stash` en un repo que otra sesión puede estar tocando.**

8. **Comparar píxeles entre vueltas necesita saber qué cambió a propósito.** `[111,92,48]` de la v3
   pasó a `[112,94,50]`. Es el efecto buscado del 450→480 en el degradado, no deriva. **Regla: al
   heredar un píxel de referencia de una revisión anterior, comprobar primero si el diff de esta
   vuelta toca el color de ese punto; si lo toca, re-derivar el esperado en vez de cantar
   regresión.** Sin esto, este número era un «CAMBIOS» falso.

9. **Del proceso, nada que reportar esta vez.** Servidor y copias fueron al scratchpad, no creé
   `.claude/launch.json` ni ningún archivo dentro del repo, el reporte va al nombre por ronda que
   pediste (`revision-joga-covers-6sep-v4.md`, archivo nuevo), y maté el servidor por **PID exacto
   verificando antes la línea de comando completa** (`ps -o command= -p 17878` → confirmado
   `http.server 8784`), no por coincidencia de dígitos. `app.js` tiene el mismo sha256 al terminar
   que al empezar.
