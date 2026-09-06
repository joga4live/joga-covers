# Revisión v2 — joga-covers, 6 sep 2026 (Nico) — segunda vuelta

**Veredicto: CAMBIOS**

Pero léase el matiz antes de alarmarse: **las 3 CRÍTICAS y las 5 IMPORTANTES de la primera vuelta
están arregladas y medidas una por una; ninguna de las 12 tareas del plan quedó sin efecto; no
encontré ninguna regresión en lo que ya funcionaba.** El veredicto es CAMBIOS por **dos defectos
MENORES nuevos, ambos medidos**, más **un incidente de proceso que sí es grave y no es de código**
(§ Incidente). Ninguno de los dos defectos rompe nada para el usuario; los dos son «el panel dice
una cosa y la portada hace otra», que es la familia de defectos que esta ronda venía a cerrar.

Repo: `/Users/joseogallardo/Documents/GitHub/joga-covers`
Auditado: el árbol de trabajo tal como estaba al empezar (`app.js` +336/−25, `index.html` +20,
`README.md` 1 línea sobre `ebc082d`).
Origen: `revision-joga-covers-6sep.md` (v1) → `plan-joga-covers-6sep.md` (T1-T12) →
`implementacion-joga-covers-6sep.md` (Tavo).

Auditoría en SOLO LECTURA. Lo único que escribí es este archivo. El servidor de prueba se levantó
**fuera del repo** (lanzado desde el scratchpad con `--directory` apuntando al repo,
`python3 -m http.server 8779`) y se mató por **PID verificado (9804)**, confirmando antes el
`command` completo del proceso y después que había muerto. No creé ningún `launch.json` ni ningún
otro archivo dentro del repo.

---

## Incidente de proceso — el código se comiteó Y SE SUBIÓ durante mi auditoría

Esto no lo buscaba; salió al hacer el `git status` final que pide el plan.

- Al **empezar** la auditoría: `HEAD = ebc082d`, y `git status` mostraba
  ` M README.md`, ` M app.js`, ` M index.html`, `?? .joga/`.
- Al **terminar**: `git status` **limpio**, `HEAD = 96689ea`, mensaje **«ejecutado»**, autor
  `joga4live`, fecha `Sun Sep 6 11:44:13 2026`.
- Ese commit contiene los 3 archivos de código **más los 4 de `.joga/handoff/`**, incluido
  **mi propio reporte a medio escribir** (el `revision-joga-covers-6sep-v2.md` de 12 líneas que
  decía «EN CURSO»). Está commiteado tal cual, con el veredicto sin escribir.
- Y no se quedó en local: `git rev-parse HEAD origin/main` da **el mismo hash**, y
  `.git/refs/remotes/origin/main` tiene fecha `Sep 6 11:44`. **Se subió a `origin/main`.**

El plan de esta ronda dice, textualmente, en sus reglas: *«NO hagas commit ni push. El líder
comitea después del APROBADO de Nico.»* Y `.joga/handoff/plan-…` es también lo que fija el orden.
Aquí se publicó **antes** del veredicto — que es exactamente el patrón que dejó el sitio roto una
semana en su día.

**Lo único bueno**: verifiqué que lo publicado es **byte a byte lo que audité**. SHA-1 de los tres
archivos, árbol de trabajo contra el commit:

| archivo | SHA-1 auditado | SHA-1 en `96689ea` |
|---|---|---|
| `app.js` | `2ff13d3e…` | `2ff13d3e…` ✔ |
| `index.html` | `ba0593f8…` | `ba0593f8…` ✔ |
| `README.md` | `48b9805f…` | `48b9805f…` ✔ |

Así que esta revisión **sí vale** para lo que hay hoy en `main`. No hay que re-auditar nada. Lo que
cambia es que los dos defectos de abajo ya están publicados, y el arreglo es una ronda corta encima
en vez de un bloqueo antes de publicar.

No sé quién hizo el commit — el autor de git es `joga4live` y no tengo forma de distinguir entre
otra sesión en paralelo y una acción manual. Sólo reporto los hechos.

---

## Defectos nuevos (los dos MENORES, los dos medidos)

### N1 — El panel vuelve a mentir sobre «Tamaño título» en cuanto tocas CUALQUIER control de tipografía
`app.js:829` (la condición `if (state.titleObject && !state.titleStyle)`)

`sincronizarPanelConEstilo()` protege la elección del usuario, y eso está bien. El problema es que
protege **el bloque entero del título** con una sola bandera: basta que `state.titleStyle` exista
—porque tocaste **uno solo** de los cuatro controles— para que dejen de sincronizarse **los cuatro**,
incluido el tamaño, que es el único que el auto-ajuste cambia solo.

Medido (viewport 1440×900, fuentes cargadas, idioma `es`):

| paso | panel «Tamaño título» | `state.titleObject.fontSize` real |
|---|---|---|
| al cargar | 62 | 62 |
| muevo **sólo** «Espaciado letras» a 60 | 62 | 62 |
| escribo un título largo (3 líneas, el auto-fit encoge) | **62** | **26** |

`state.titleStyle` en ese momento es `{ charSpacing: 60 }` — ni siquiera contiene `fontSize`.

**Prueba de control** (la misma secuencia sin tocar el espaciado): panel **26**, real **26**,
`state.titleStyle === null`. O sea: el fallo es del código, no de mi arnés — el sincronizador
funciona perfectamente cuando la bandera está en `null`.

Es la reaparición exacta de **M3**, la que T11 venía a cerrar, sólo que ahora condicionada. Es
estrictamente mejor que antes (antes mentía siempre), pero sigue mintiendo.

**Qué falta:** que la bandera sea por propiedad, no por bloque. Sincronizar cada control salvo el
que el usuario tocó: `if (!state.titleStyle || state.titleStyle.fontSize === undefined) { …tamaño… }`,
y lo mismo para color, fuente y espaciado por separado.

### N2 — Reset no devuelve «Oscurecer fondo» ni «Sombra texto» a sus valores por defecto
`app.js:1149-1172` (`resetBtn`)

El plan T11 pide, textualmente: *«…y devolver selects, sliders y color pickers a los valores por
defecto de `index.html`»*. Los del bloque TIPOGRAFÍA sí vuelven, pero por la puerta de atrás
(`sincronizarPanelConEstilo` los lee del objeto recién creado, y coincide). Los dos sliders del
bloque EFECTOS **no vuelven**, porque nadie los toca.

Medido:

| control | defecto en `index.html` | lo dejo en | tras pulsar Reset |
|---|---|---|---|
| `titleShadow` (`index.html:580`) | 6 | 0 | **0** — y `state.titleObject.shadow === null` |
| `overlayOpacity` (`index.html:573`) | 52 | 90 | **90** (etiqueta «90%») |

El panel **no miente** (muestra lo que de verdad está aplicado), así que no es el defecto M1/M3.
Es que Reset no resetea: pulsas «Reset» sobre una portada que oscureciste al 90 % y se queda al
90 %, sin sombra en el título. Para José eso es «el botón no funciona».

**Qué falta:** dos líneas en `resetBtn`, poniendo `titleShadow.value = 6` y
`overlayOpacity.value = 52` (con su etiqueta `overlayValue`) **antes** de `applyTemplate`, para que
`applyShadow`/`applyOverlay` los recojan.

---

## Lo que pasó de FALLA a PASA (las 12 tareas, una por una, con la medición)

Todo lo de abajo está **medido en el navegador real**, viewport fijado a **1440×900** antes de
tocar geometría, fuentes en estado `loaded`, `documentElement.lang = "es"` en todas las pasadas.

### Críticas

**C1 / T1 — el `keydown` global ya no pisa los campos de texto.** `app.js:912-961`
Secuencia exacta de la primera vuelta: escribo `ABCDEF` en el campo «Título» (tecleado de verdad),
hago clic sobre el título en el lienzo (`canvas.getActiveObject() === state.titleObject` → `true`),
vuelvo al campo con un clic real (foco `INPUT#titleInput`, cursor en 6-6), y pulso Backspace.

| | v1 (antes) | v2 (ahora) |
|---|---|---|
| valor del campo | `""` — **borrado entero** | `"ABCDEF"` — intacto |
| `state.titleObject.text` | `""` | `"ABCDEF"` |
| `defaultPrevented` tras todos los listeners | `true` | **`false`** |

Con el **modal de Canva abierto** y el título seleccionado por detrás (el otro camino que en v1
borraba el título a ciegas): Backspace → campo intacto (`"El Despertar Interior"`),
`defaultPrevented === false`. El guard que actúa ahí es el del modal, no el de `INPUT` — probado
con el foco en `BUTTON#canvaBtn`, o sea el caso real.

**Aviso honesto sobre esta medición**: mi arnés dispara el `keydown` pero **no ejecuta la acción
nativa de borrado del navegador**. Lo comprobé a propósito: con el campo enfocado y **nada**
seleccionado en el lienzo, Backspace tampoco borra la letra, y escuchando `beforeinput` en el campo
sólo aparece `insertText` al teclear — **nunca** `deleteContentBackward`. Así que lo que puedo
afirmar medido es: el handler ya no vacía el campo y ya no llama a `preventDefault()`. El «queda
`ABCDE`» depende sólo del comportamiento nativo del navegador una vez que nadie previene el evento,
y eso es garantía de plataforma, no del código. **Control que sí valida el instrumento**: el mismo
Backspace, mismo arnés, con el foco en `BODY` y el título seleccionado, **sí** vacía el campo
(`titleInput` → `""`, `state.titleObject` → `null`, `defaultPrevented === true`). El arnés llega al
listener; lo que no hace es editar texto.

**C2 / T2 — Higgsfield en contexto no seguro.** `app.js:691-700` + `1204-1234`
Con `navigator.clipboard` puesto en `undefined` mediante `Object.defineProperty` (que es
literalmente lo que ve la página en `file://` o por IP de red local sin TLS), clic real en «Copiar
prompt y abrir Higgsfield»:

| | v1 | v2 |
|---|---|---|
| `window.prompt` | 0 veces | **1** vez, `('Copia manualmente:', 'PROMPT DE PRUEBA NICO')` |
| `window.open` | 0 veces | **1** vez, `https://higgsfield.ai/es/ai/image?model=gpt_image_2` |
| consola | `Uncaught TypeError … 'writeText'` | **0 errores** |

**C3 / T2 — «Descargar y abrir Canva» ya no se queda colgado.** `app.js:1264-1308`
Mismo contexto no seguro simulado, clic real en el botón del modal:

| | v1 | v2 |
|---|---|---|
| descarga del PNG | sí | sí (`joga-cover-el-despertar-interior-….png`, 2 095 KB en base64) |
| `window.open` (Canva) | **0** | **1**, `https://www.canva.com/create/book-covers/` |
| modal | **seguía abierto** | **cerrado** |
| toast | **ninguno** | `✓ Portada descargada · Abriendo Canva…` — **sin** «Título copiado», correcto |
| consola | `Uncaught TypeError` | **0 errores** |

Y el camino feliz también, con un `writeText` que resuelve: se copia
`"El Despertar Interior\nUn viaje…"`, 1 descarga, 1 `window.open`, modal cerrado y toast
`✓ Portada descargada · Título copiado · Abriendo Canva…`. 0 errores.

### Importantes

**I1 / T3 — la tipografía ya no se deshace al escribir.** `app.js:588`, `643`, `1035-1086`
La tabla de la primera vuelta, repetida:

| | fuente | tamaño | color | espaciado | color autor |
|---|---|---|---|---|---|
| tras tocar los 5 controles | Bebas Neue | 120 | `#ff0000` | 200 | `#00ff00` |
| **tras escribir UNA letra** (en «Subtítulo», tecleada de verdad) | **Bebas Neue** | **120** | **`#ff0000`** | **200** | **`#00ff00`** |
| lo que muestra el panel | Bebas Neue | 120 | `#ff0000` | 200 | `#00ff00` |

En v1 la fila del medio volvía a Fraunces / 62 / `#f5f0e8` / 20. Lienzo y panel coinciden en los
cinco valores.

**I2 / T4 — `width` en el snapshot.** `app.js:864`
Arrastre **real** de la asa `mr` del título sobre el lienzo (drag de ratón, verificado por los
eventos que recibió Fabric):

| | v1 | v2 |
|---|---|---|
| ancho tras el arrastre | 440 | 324,1 |
| `state.titleOverride` | `{left, top, scaleX, scaleY, angle}` — **sin `width`** | incluye **`width: 324.1`** |
| ancho tras escribir una letra | **vuelve a 520** | **324,1** — se mantiene |
| bbox tras la letra | descentrada 40 px, borde izq. en **−1** (fuera de la portada) | `40 … 365`, **idéntica** a antes de escribir, entera dentro de la portada |

**I3 / T5 — se acabó la caja fantasma.** `app.js:530`, `600`, `627`
Borrado el título con Delete real: `canvas.getObjects()` queda en
`[rect, rect, textbox(subtítulo), textbox(autor), text(◆)]` — **ningún textbox vacío**, y
`state.titleObject === null`. Clics reales en las dos coordenadas de la primera vuelta:
Fabric recibió el puntero en `(298.8, 421.2)` y en `(146.4, 429.6)` y en ambos casos
`target: null` y `canvas.getActiveObject() === null`. En v1 ambos seleccionaban un fantasma de
521 × 89.

Tavo extendió el arreglo a subtítulo y autor, y lo comprobé en el caso de uso real (portada propia
de fondo): con una imagen personalizada puesta, Delete sobre el subtítulo y luego sobre el autor los
quita limpiamente (`state.subtitleObject`/`authorObject` → `null`, sin textbox vacío), **el fondo de
imagen sobrevive** y no queda ninguna miniatura resaltada.

**I4 / T6 — la sombra se puede quitar.** `app.js:711-714`

| slider | `state.titleObject.shadow` |
|---|---|
| 6 (inicial) | `{blur: 12, offsetY: 3}` |
| 20 | `{blur: 40, offsetY: 10}` |
| **0** | **`null`** — inmediato, sin escribir nada más |

**I5 / T7 — editar en el lienzo ya no se pierde.** `app.js:873-896`
Doble clic real sobre el título → `isEditing: true`, foco en el `TEXTAREA` oculto de Fabric →
tecleo → el objeto queda `"El ZZZ Interior"` y el campo «Título» **se actualiza en vivo** al mismo
valor. Clic fuera → `isEditing: false`, texto conservado. Después escribo una letra en «Subtítulo»:
el título del lienzo **sigue** en `"El ZZZ Interior"` y el campo también. En v1 volvía a
`"El Despertar Interior"`.

Sin bucles: escribir `.value` no dispara `input`, no hubo recursión ni recreación a media edición,
y la consola quedó en 0 errores durante toda la secuencia.

**Corrijo una duda que Tavo dejó anotada** (§T7 de su reporte): temía que al editar el **autor** por
doble clic el campo de la derecha acabara en MAYÚSCULAS. Medido: no pasa en el camino normal. Doble
clic sobre `JOGA` + tecla → objeto `"a"`, campo `"a"` (minúscula, porque el doble clic seleccionó la
palabra y la reemplazó). Sólo si alguien **añade** una letra sin reemplazar quedaría `"JOGAa"` en el
campo y `"JOGAA"` en la portada al siguiente repintado. Cosmético y de esquina; no lo cuento como
defecto.

### Menores

**M2 / T8 — el ornamento.** `app.js:648-669`, `870`, `939-951`
Arrastre real del ◆ de `top 340` → `top 443`; escribo una letra → **sigue en 443**, y la bbox sigue
centrada (`292 … 307`, centro 299,5 sobre una portada de 600) — o sea, meter `width` en el snapshot
**no descolocó** al `fabric.Text`, que era mi sospecha al leer el diff.
Seleccionado + Delete real → desaparece (`state.ornamentObject === null`, `ornamentOculto: true`,
ningún objeto `text` en el lienzo) y **no vuelve** al escribir. Al cambiar de plantilla
`ornamentOculto` se limpia y el ornamento reaparece en las plantillas que lo tienen.

**M3 / T11 — el panel al arrancar.** `app.js:828-847`

| | v1 | v2 |
|---|---|---|
| etiqueta «Tamaño título» | 72 (real 62) | **62** = real 62 |
| slider `titleSize` | 72 | **62** |
| «Color autor» | `#d4a744` (real `#f5f0e8`) | **`#f5f0e8`** = real |
| «Espaciado letras» | 0 (real 20) | **20** = real |
| «Fuente del título» | Fraunces = real | Fraunces = real |

Y no sólo en la plantilla por defecto: recorrí **las 13** y en las 13 la etiqueta de tamaño y el
color del título coinciden con el objeto (62/62, 57/57, 56/56, 50/50, 56/56, 62/62, 64/64, 58/58,
54/54, 62/62, 61/61, 49/49, 62/62), 0 errores. (La laguna está en N1, cuando ya tocaste un control.)

**M1 / T11 — el resaltado de fondo.** `app.js:1099-1133`, `1166-1170`
Elijo «Business» (`currentBg: 'example-business'`, miniatura resaltada) → **Reset** → resaltada
**«Dorado»** y sólo ella, `currentBg: 'solid-gold'`. En v1 seguía resaltada «Business».
Suelto un PNG de 400 × 640 sobre el lienzo → `currentBg: 'custom'` y **ninguna** miniatura
resaltada. En v1 se quedaba resaltada la última tocada.

**M4 / T10 — el toast anima de verdad.** `index.html:76-85`
El keyframe existe ahora (`@keyframes toastIn { 0% {opacity:0; transform: translate(-50%,10px)} 100% {opacity:1; transform: translate(-50%,0)} }`;
en v1 el `grep keyframes` daba 0) y **anima**: `animationName: "toastIn"`, opacidad medida `0` en el
primer frame y `1` a los 400 ms, transform `matrix(…,-71.39, 10)` → `matrix(…,-71.39, 0)`. El
`-71.39` es la mitad del ancho del toast: **el centrado horizontal se conserva** durante la
animación, que era el riesgo de escribir un keyframe con `transform` sobre un elemento ya centrado
con `translate(-50%)`.

**M7 / T10 — el botón «+».** `index.html:318-329`

| | `.bg-thumb.upload` (el «+») | `.bg-thumb.solid-gold` |
|---|---|---|
| `margin-bottom` | **0px** (v1: 6px) | 0px |
| `text-transform` | `none` | — |
| `letter-spacing` | `normal` | — |
| tamaño de caja | 135 × 202 | 135 × 202 |

**M6 / T12 — README.** `README.md:14` dice ahora `1600×2560 px`, que es lo que exporta de verdad
(medido más abajo). En v1 decía 1600×2400.

**M5 / T9 — Escape.** `app.js:912-922`
Modal abierto + Escape con el foco en `BUTTON#canvaBtn` → cerrado. Modal abierto + Escape con el
foco en `INPUT#titleInput` → **cerrado igual**, que es lo que el plan pedía explícitamente. En v1
Escape no hacía nada.

**M8** — fuera de esta ronda a propósito. Sigue igual: la rejilla `320px 1fr 320px`
(`index.html:19`) deja la columna central en 0 por debajo de ~680 px. Lo topé de frente otra vez:
el panel del navegador arranca con un viewport de **434 × 240** y ahí la medición no vale nada.
Por eso lo primero que hice fue fijar 1440 × 900.

---

## Lo que ya funcionaba y sigue funcionando (re-medido, como pedía Tavo)

- **Export PNG: 1600 × 2560 exactos**, ratio 1,600 (lo que pide Amazon KDP), 2 047 KB.
  **Sin asas coladas**: exporté con el título **seleccionado** (`hasControls: true`) y muestreé los
  tres píxeles donde estarían las asas `ml`, `mr` y la esquina `tl` (coordenadas de lienzo
  × 2,667): `[107,95,75,255]`, `[112,104,88,255]`, `[108,97,77,255]` — colores del fondo, ni rastro
  del azul/blanco de los controles de Fabric.
- **Sin contaminación CORS**: con uno de los fondos de imagen del propio repo puesto, el export
  sale igual (1600 × 2560, 4 061 KB). El lienzo no queda «tainted».
- **Drag & drop de imagen**: soltado un PNG de 400 × 640 sobre `.canvas-area` → el fondo pasa de
  `rect` a `image`, escala 1,5, cubriendo **600 × 960** exactos.
- **Botón «+»**: clic real sobre el `<label>` → el `<input type="file">` recibió **1** clic.
- **Los 3 botones del modal y el clic fuera**: ×, «Cancelar» y el clic en el fondo del overlay
  cierran los tres (medido uno por uno con clics reales). «Descargar y abrir Canva» ya cubierto en
  C3.
- **Clics alineados con el lienzo escalado**: con la portada a escala 0,833 (500 × 800 CSS sobre
  600 × 960 reales), un clic en CSS (719, 457) llega a Fabric en **(298,8 · 452,4)** — exactamente
  `(719−470)/0.8333` y `(457−80)/0.8333` — y selecciona el título. Un clic en zona vacía devuelve
  `target: null`.
- **13 plantillas y 12 presets de IA**: 13 `.template-card` ↔ 13 claves en `templates`; 12 opciones
  del `<select>` de prompts ↔ 12 claves en `promptPresets`, 0 huérfanas; 5 opciones de `canvaPreset`
  ↔ 5 claves en `canvaLinks`, 0 huérfanas. Las 13 plantillas aplican **sin un solo error**.
- **Los 8 fondos prefijados** (4 degradados + 4 imágenes) aplican sin error y dejan resaltada sólo
  la suya.
- **«Oscurecer fondo»** sigue vivo: 10 → `rgba(0,0,0,0.1)`, 52 → `rgba(0,0,0,0.52)`,
  80 → `rgba(0,0,0,0.8)`, con la etiqueta coincidiendo.
- **`kdpBtn`** apunta a `./amazon-kdp-guide.html`, que responde **200**.
- **0 errores en consola al cargar** (recarga limpia; lo único que aparece son los
  `warn: 'alphabetical' is not a valid CanvasTextBaseline` que emite Fabric 5.3.0 de fábrica, ya
  presentes antes de esta ronda).
- **Sintaxis:** `node --check app.js` → **OK**. `index.html` no tiene ni un script inline; sólo
  `<script src="…fabric.min.js">` y `<script src="app.js">`.
- **Paridad de ids:** los **29** `getElementById` de `app.js` existen los 29 en `index.html`.
  0 faltantes.

## Las 4 reglas de oro

Confirmo lo que dijo Tavo, comprobado por mi cuenta:
1. **Gate** — no existe `gate.js` en este repo. No aplica.
2. **Service worker** — no existe `sw.js` ni `service-worker.js`. No aplica.
3. **i18n** — no hay diccionarios ni toggle ES/EN; la UI es sólo en español (los comentarios del
   código sí son bilingües, y esta ronda mantuvo el estilo). No aplica.
4. **Branding** — el `git diff` de `index.html` no toca ni una línea con «Joga», logo, emblema ni
   marca: sólo añade un `@keyframes` y tres propiedades a `.bg-thumb.upload`. **Intacto.**

**`localStorage`**: este proyecto no usa ni `localStorage` ni `sessionStorage` (0 ocurrencias en
`app.js` e `index.html`), así que no hay llaves que renombrar ni progreso de usuario que perder.

**Alcance**: los archivos tocados son exactamente `app.js`, `index.html`, `README.md` y
`.joga/handoff/*`. Nada fuera de lo que el plan autorizaba. (Con la salvedad del § Incidente: ese
alcance está ahora dentro de un commit ya subido.)

---

## Lecciones de esta vuelta

1. **Un commit antes del veredicto invalida el proceso aunque el código esté bien.** Aquí salió
   bien de milagro: verifiqué por SHA-1 que lo publicado es idéntico a lo que medí. Si el commit
   hubiera incluido un cambio posterior, mi «APROBADO» habría certificado un árbol que ya no
   existía. **Regla: quien comitea confirma antes que el `HEAD` y el árbol son los mismos que
   auditó el revisor, y lo dice con el hash.** Y complementaria, para el revisor: **anota el `HEAD`
   y el `git status` al empezar Y al terminar, y compara** — es como se detecta esto.
2. **Un reporte «EN CURSO» es un archivo del repo y se lo lleva cualquier `git add -A`.** El mío
   se subió a `origin/main` con el veredicto sin escribir. **Regla: los borradores del revisor van
   fuera del árbol de trabajo (scratchpad) hasta que hay veredicto, o `.joga/handoff/` entra en
   `.gitignore` mientras una ronda está en vuelo.**
3. **Una bandera booleana no puede proteger cuatro propiedades independientes.** Es la lección 1 de
   la primera vuelta, girada: entonces el snapshot enumeró de memoria las propiedades que se
   guardan; ahora el sincronizador usa **una** bandera para decidir sobre **cuatro** controles.
   **Regla: si el usuario puede tocar N controles por separado, el estado que decide «esto lo puso
   él» tiene que tener N entradas, no una.**
4. **«Resetear» significa devolver TODOS los controles, no los que se arreglan solos.** Los
   controles de tipografía volvieron a su sitio por un efecto lateral (el sincronizador los lee del
   objeto recién creado) y eso escondió que los de EFECTOS no volvían. **Regla: un Reset se prueba
   moviendo todos los controles primero, no sólo los que la tarea menciona.**
5. **Un «Acepta:» más estrecho que su propia tarea deja hueco.** T11 pedía en el cuerpo «devolver
   selects, sliders y color pickers a los valores por defecto», pero su «Acepta:» sólo hablaba de la
   etiqueta, el color de autor y la miniatura. Tavo cumplió el «Acepta:». **Regla: el «Acepta:» de
   cada tarea tiene que cubrir cada verbo del cuerpo de la tarea; si no lo cubre, el cuerpo se
   recorta al «Acepta:».**
6. **Mi arnés me mintió otra vez, y otra vez la culpa era del arnés — dos veces distintas:**
   - **Coordenadas.** El panel del navegador escala la ventana emulada, y sus clics **no** caen
     donde dicen: pedí un clic en el marco (384, 244) sobre un viewport de 1440 × 900 y la página lo
     recibió en **(2699, 1717)**, fuera de la pantalla. Los clics por `ref` fallan igual, con otro
     factor. Lo resolví **calibrando**: instalé un `mousedown` que registra `clientX/clientY`, tiré
     dos clics de prueba y despejé el factor (7,04 y luego 6,735 cuando el marco cambió de 768×480 a
     800×500 a mitad de sesión). **Regla: antes de creer un solo clic, mide a dónde llega de verdad;
     y re-calibra cada vez que cambie el tamaño de la captura, porque el factor cambia con él.**
   - **Teclas de edición.** Mi `Backspace` dispara el `keydown` pero **no ejecuta la acción nativa
     del navegador**: escuchando `beforeinput` en el campo, al teclear sale `insertText` y al pulsar
     Backspace **no sale nada**. Estuve a punto de reportar como defecto que «la letra no se borra».
     **Regla: cuando una medición negativa te sorprenda, comprueba el mismo efecto en un caso donde
     DEBE funcionar antes de escribirlo como fallo** — aquí, el mismo Backspace con el foco en
     `BODY` sí vaciaba el campo, que es lo que probó que el evento llega y que lo que falta es la
     edición nativa. Y **di en el reporte qué parte quedó medida y qué parte queda apoyada en
     garantía de plataforma**, en vez de escribir «PASA» a secas.
7. **La prueba de control no es un trámite: aquí distinguió un defecto real de un artefacto.** El
   hallazgo N1 y el falso fallo del Backspace se veían igual de mal en la primera lectura. Lo que
   los separó fue correr, en los dos casos, la misma secuencia en el escenario donde el resultado es
   conocido. **Regla: por cada resultado negativo, una corrida gemela en el caso conocido. Sin ella
   no se escribe ni «PASA» ni «FALLA».**
8. **Fijar viewport e idioma antes de medir geometría sigue siendo obligatorio, y esta vez casi me
   pilla al revés:** el panel arranca en **434 × 240**, donde la columna central mide 0 y todo
   miente (M8). Lo fijé a 1440 × 900 y anoté `lang="es"` y `document.fonts.status === "loaded"`
   junto a cada número.
9. **Al limpiar, matar por PID verificado.** `pgrep -lf "http.server 8779"` → PID **9804**,
   confirmé el `command` completo, mandé la señal y comprobé después que había muerto. Nunca por
   coincidencia de dígitos.

---

## Qué hace falta para el APROBADO

Dos arreglos, los dos pequeños, los dos en `app.js`:

- **N1** — `app.js:829`: que `sincronizarPanelConEstilo` decida control por control
  (`state.titleStyle.fontSize === undefined`, etc.) en vez de saltarse el bloque entero.
- **N2** — `app.js:1149-1172`: que `resetBtn` devuelva `titleShadow` a 6 y `overlayOpacity` a 52
  (con su etiqueta) antes de `applyTemplate`.

Y, en la parte de proceso: dejar constancia de que `96689ea` se subió sin veredicto, y acordar que
la próxima ronda no se comitea hasta que este archivo diga APROBADO.
