# Implementación — joga-covers, ronda 6-sep-2026 (Tavo)

**Estado: COMPLETADO** (las 12 tareas del plan están en el código; ver más abajo qué está
medido por comando y qué queda PENDIENTE DE MEDICIÓN en navegador — es una parte real y no
menor de esta ronda, léase la nota de "Aviso" antes de aprobar).

Origen: `plan-joga-covers-6sep.md` (Kimo MD), a partir de `revision-joga-covers-6sep.md` (Nico,
veredicto CAMBIOS). Se construyó encima del cambio SIN comitear que ya estaba en el working tree
(`app.js`, listener `keydown` de Delete/Backspace, arreglo #4) — no se descartó, se extendió.

---

## Aviso — contradicción entre el plan y mi rol (como pide AGENTS.md que se declare)

El plan pide medir cada "Acepta:" **en el navegador de verdad**, levantando
`python3 -m http.server 8778` desde el scratchpad. Mi propia definición de agente (Tavo) dice
explícitamente: *"tú no levantas servidores ni navegadores — eso es de Nico y de Kimo MD"* y que,
cuando el plan pide medir algo que mi rol no me deja medir, tengo que decirlo en vez de elegir en
silencio.

Elegí **seguir la regla de mi rol**: no levanté servidor ni navegador. Hice dos cosas en su lugar:

1. Verifiqué con comandos todo lo que se puede verificar sin navegador: sintaxis, paridad de ids,
   greps de conteo, y — para T1 y T2, que son las críticas — extraje la lógica exacta de
   `app.js` y la corrí en Node con mocks controlados (detallado en cada tarea). Esto **no**
   reemplaza una prueba real de clic + Fabric + DOM, pero es más que "leí el código y creo que
   funciona": es la misma función, ejecutada, con las mismas entradas que el fallo original.
2. Para todo lo que de verdad requiere ver la pantalla o hacer clic con Fabric activo (geometría
   en px, si el panel se ve sincronizado, si el toast anima, si un clic real cae donde debe),
   lo dejo marcado **PENDIENTE DE MEDICIÓN**, con el comando/pasos exactos y el resultado que
   espero, para que Nico lo mida con el navegador que sí tiene permitido levantar.

Si Kimo MD prefiere que en esta ronda yo sí levante el navegador, dígalo explícitamente en el
próximo plan — no lo voy a asumir de un prompt que contradice mi propia definición de rol.

---

## Verificación global (comandos)

- `node --check app.js` → **OK**, sin errores de sintaxis.
- Paridad de ids: 29 `getElementById` distintos en `app.js`, los 29 existen en `index.html`
  (que tiene 30 ids en total). 0 faltantes — medido con un script Node que parsea ambos archivos.
- `grep -n "navigator.clipboard"` en `app.js`: las únicas 4 ocurrencias están dentro de
  `copiarAlPortapapeles()` (líneas 678-696, comentario + cuerpo). **Cero** usos sueltos en
  `iaGenerate` o `modalContinue` — los dos puntos que fallaban en C2/C3 ahora pasan por el helper.
- `git status --porcelain`: `M README.md`, `M app.js`, `M index.html`, `?? .joga/` — nada fuera
  de lo que el plan autorizó tocar.
- `git diff --stat`: `README.md` 1 línea, `app.js` +336/-25 líneas, `index.html` +20 líneas.
- No hay `gate.js` ni service worker (`sw.js` / `service-worker*`) en este repo — las reglas de
  oro #1 y #2 (gate SHA-256, versión del service worker) son de Joga Intelligence, no aplican a
  joga-covers. Tampoco hay toggle ES/EN ni diccionarios `es:{}`/`en:{}` (regla #3): este proyecto
  usa comentarios bilingües en el código pero la UI es solo en español — confirmado con
  `grep -n "es:{" app.js index.html` (0 resultados). No se tocó branding/logo (regla #4).

---

## T1 — CRÍTICO C1: el `keydown` no debe actuar sobre campos de texto

`app.js:912-961` (dentro del listener `keydown` ya existente, sin comitear).

Añadí, antes de mirar el objeto activo del lienzo: salir si `e.target` es `INPUT`, `TEXTAREA`,
`SELECT` o `isContentEditable` (línea 934-935), y salir también si `canvaModal` tiene la clase
`active` (línea 936). El branch de Escape (T9) va ANTES de este guard y no lo respeta a propósito
(ver T9).

**Medido por comando** (Node, extrayendo la condición exacta de las líneas 934-936 y probándola
con los `e.target` que describe la tabla de aceptación):

| caso | `ignora` | esperado |
|---|---|---|
| `INPUT` (campo Título) | true | true |
| `TEXTAREA` (prompt IA) | true | true |
| `SELECT` (fuente) | true | true |
| `contentEditable` | true | true |
| `BODY` sin foco, modal cerrado | false | false |
| `BODY` sin foco, modal **abierto** | true | true |
| `CANVAS` (clic en lienzo), modal cerrado | false | false |

Los 7 casos dieron el resultado esperado.

**PENDIENTE DE MEDICIÓN** (necesita Fabric + un clic/tecla real, que es justo donde el arnés de
Nico encontró el bug original — un evento sintético no basta): con el título seleccionado en el
lienzo, clic en el campo «Título» con `ABCDEF`, Backspace real (CDP, no `dispatchEvent`) →
espero `ABCDE` en el campo y `defaultPrevented === false` para ese evento (porque ahora el guard
sale ANTES del `preventDefault`). Control: sin el guard, medía `""` — con el guard puesto, la
condición de la tabla de arriba dice que un `INPUT` hace que la función salga en la primera
línea, así que nunca llega a `e.preventDefault()`.

## T2 — CRÍTICO C2 + C3: portapapeles en contexto no seguro

`app.js:691-700` (helper nuevo `copiarAlPortapapeles`), usado en `iaGenerate` (`app.js:1204-1234`)
y `modalContinue` (`app.js:1264-1308`). Comentario corregido en `app.js:1205-1216` (ya no dice
que cubre «http sin TLS» sin cubrirlo).

**Medido por comando** (Node, extrayendo el cuerpo EXACTO de `copiarAlPortapapeles` de
`app.js:691-700` y ejecutándolo con `navigator` mockeado con `Object.defineProperty` — en Node 24
`global.navigator` es un getter sin setter y una asignación directa falla en silencio, así que
usé `defineProperty` para que el mock sí pegara; lo dejo anotado porque es la clase de trampa de
instrumento que Nico pide reportar):

| escenario | resultado | esperado |
|---|---|---|
| `navigator.clipboard` es `undefined` (el caso real de C2/C3: `file://` o IP local sin TLS) | `false` | `false` |
| `writeText` lanza `TypeError` SÍNCRONO | `false`, sin tronar el proceso | `false` |
| `writeText` devuelve una promesa que rechaza (permiso denegado) | `false` | `false` |
| `writeText` resuelve normal (contexto seguro) | `true` | `true` |

Los 4 casos dieron el resultado esperado, y en ningún caso quedó una excepción sin atrapar —el
defecto exacto que Nico midió como `Uncaught TypeError: Cannot read properties of undefined
(reading 'writeText')` no puede volver a pasar con este helper, porque el `try/catch` envuelve la
llamada síncrona, no solo el `.catch()` de la promesa.

**PENDIENTE DE MEDICIÓN** (requiere el flujo completo de clic + `window.prompt` +
`window.open` + toast en un DOM real):
- `iaGenerate` con `navigator.clipboard = undefined`: espero `window.prompt('Copia
  manualmente:', promptText)` llamado 1 vez y `window.open(...)` llamado 1 vez, sin
  `Uncaught TypeError` en consola.
- `modalContinue` en el mismo escenario: espero que el PNG se descargue igual, `window.open`
  (Canva) se llame 1 vez, el modal se cierre, y el toast diga «✓ Portada descargada · Abriendo
  Canva…» (SIN «Título copiado»), también sin error en consola.

## T3 — IMPORTANTE I1: la tipografía se revierte al escribir

`app.js:16,44-53` (nuevo `state.titleStyle`/`state.authorStyle`), `app.js:584-588` y `642-643`
(`setTitleStyle`/`setAuthorStyle` aplican el estilo elegido DESPUÉS de construir el objeto, igual
que el patrón de `titleOverride`), `app.js:1035-1086` (los 5 handlers de `titleFont`,
`titleColor`, `titleSize`, `titleSpacing`, `authorColor` ahora escriben en `state.titleStyle` /
`state.authorStyle` además de pintar en vivo), `app.js:802-803` (se limpia solo al cambiar de
verdad de plantilla o Reset, igual que los overrides de posición).

**Verificado por lectura de código + comando**: `grep -n "state.titleStyle\|state.authorStyle"
app.js` confirma que se escribe en los 5 handlers, se lee en `setTitleStyle`/`setAuthorStyle`, y
se limpia en `applyTemplate` (solo si `id !== state.lastAppliedTemplate`) y en `resetBtn`. La
lógica es: `setTitleStyle` construye el objeto con los valores DE LA PLANTILLA y luego, si
`state.titleStyle` existe, hace `.set(state.titleStyle)` — así que cualquier campo que el usuario
haya tocado (fuente/color/tamaño/espaciado) gana sobre el valor de plantilla, y los que no tocó
quedan con el valor de plantilla intacto.

**PENDIENTE DE MEDICIÓN** (requiere Fabric real para confirmar que el render final coincide):
tabla de Nico — Bebas Neue / 120 / `#ff0000` / 200 en el título, escribir UNA letra en cualquier
campo → espero que `state.titleObject.fontFamily/fontSize/fill/charSpacing` sigan siendo esos
4 valores (porque `setTitleStyle` los reaplica en cada llamada, no solo la primera vez), y que el
panel (`titleFont`, `titleColor`, `titleSizeValue`, `titleSpacingValue`) los siga mostrando
porque `sincronizarPanelConEstilo()` no los toca cuando `state.titleStyle` existe. Mismo
razonamiento para `authorColor`.

## T4 — IMPORTANTE I2: el snapshot no guardaba `width`

`app.js:853-871` (`object:modified`): añadida la clave `width: obj.width` al snapshot
(línea 866), y un branch nuevo para el ornamento (`state.ornamentOverride`, T8).

**Verificado por lectura**: como `state.titleOverride` se aplica con `.set(state.titleOverride)`
DESPUÉS de construir el `Textbox` (línea 589, sin cambios — ya existía), añadir `width` al
objeto snapshot es suficiente: Fabric acepta `width` como cualquier otra propiedad en `.set()`.

**PENDIENTE DE MEDICIÓN** (requiere arrastre real de una asa lateral, que es interacción de
mouse sobre Fabric): arrastrar la asa `mr` del título de 520 a 440 → escribir una letra → espero
que `state.titleObject.width === 440` y que la bbox quede centrada en x=300 (antes: `left` se
reaplicaba contra el ancho viejo de 520 y quedaba descentrado 40 px, medido por Nico).

## T5 — IMPORTANTE I3: caja fantasma al borrar el título

`app.js:523-530` (`setTitleStyle` gana el mismo `if (!text) { state.titleObject = null; return;
}` que ya tenían subtítulo/autor), y **además** — el plan pide "las tres funciones" — añadí el
mismo `state.xObject = null` a `setSubtitleStyle` (`app.js:594-600`) y `setAuthorStyle`
(`app.js:620-627`), que antes sacaban el objeto del lienzo pero dejaban la referencia vieja en
`state` (bug latente, no reportado explícitamente por Nico para subtítulo/autor pero sí pedido
por el plan).

**Verificado por comando**: `grep -n "Object = null" app.js` muestra las 3 líneas de guarda
(530, 600, 627) más las 3 del manejo del ornamento (T8).

**PENDIENTE DE MEDICIÓN**: borrar el título con Delete → espero que `canvas.getObjects()` no
tenga ningún Textbox con `text === ""`, y que un clic en (300,420) y (150,430) no seleccione
nada (antes seleccionaba el fantasma de 521×89 px).

## T6 — IMPORTANTE I4: la sombra no se podía quitar

`app.js:702-718` (`applyShadow`): añadido el `else obj.set('shadow', null)`.

**Verificado por lectura**: cambio de una línea, sin ambigüedad — `if (shadowVal > 0) {...} else
{ obj.set('shadow', null); }` cubre el caso que faltaba.

**PENDIENTE DE MEDICIÓN**: slider a 20 → blur 40 (sin cambios, ya funcionaba); slider a 0 →
espero `state.titleObject.shadow === null` inmediatamente, sin tener que escribir otra letra.

## T7 — IMPORTANTE I5: el texto editado en el lienzo se perdía

`app.js:873-896`: nuevo listener `canvas.on('text:changed', ...)` que escribe `obj.text` en el
`<input>` correspondiente usando `.value = ...` (no dispara el evento `input`, así que no hay
recursión ni recreación del objeto a media edición).

**Verificado por lectura + comportamiento de la plataforma**: asignar `.value` en JS nunca
dispara el evento `input` del DOM (solo lo hace la interacción real del usuario o
`dispatchEvent` explícito) — es comportamiento estándar del DOM, no algo que dependa de Fabric,
así que no hace falta un guard extra contra recursión.

Nota que dejo para Nico: el campo «Autor» guarda el texto en MAYÚSCULAS en el objeto de Fabric
(`text.toUpperCase()`, sin cambios de esta ronda). Si se edita el autor con doble clic en el
lienzo, el input de la derecha quedará en mayúsculas tras la sincronización — no es un bug nuevo
de T7, es que el plan pide sincronizar "título/subtítulo/autor" los tres por igual y el autor ya
tenía la peculiaridad de mostrarse en mayúsculas. No lo cambié porque no estaba en el plan ni en
la revisión.

**PENDIENTE DE MEDICIÓN**: doble clic en el título, cambiar el texto, clic fuera, escribir en
«Subtítulo» → espero que el título del lienzo conserve el texto editado y que el campo «Título»
lo muestre (antes volvía a «El Despertar Interior»).

## T8 — MENOR M2: el ornamento pierde el arrastre y Delete no lo borra

`app.js:36-43` (nuevo `state.ornamentOverride`/`state.ornamentOculto`), `app.js:648-669`
(`addOrnament` aplica el override y respeta `ornamentOculto`), `app.js:870` (snapshot en
`object:modified`), `app.js:939-951` (branch nuevo en el `keydown` para Delete/Backspace sobre el
ornamento), `app.js:800-801` y `1156-1157` (se limpia en cambio de plantilla y en Reset).

**Verificado por comando**: `grep -n "ornamentOverride\|ornamentOculto" app.js` — 9 ocurrencias,
cubriendo declaración, lectura en `addOrnament`, escritura en `object:modified` y en el `keydown`,
y limpieza en `applyTemplate`/`resetBtn`.

**PENDIENTE DE MEDICIÓN**: arrastrar el ornamento de top 340 a 440 → escribir una letra → espero
que siga en 440. Seleccionarlo y Delete → espero que desaparezca y no regrese al escribir (antes
Delete no hacía nada sobre el ornamento).

## T9 — MENOR M5: Escape cierra el modal de Canva

`app.js:912-922`: branch de `Escape` puesto AL PRINCIPIO del listener `keydown`, antes del guard
de T1, para que funcione con el foco en cualquier campo.

**Verificado por lectura**: el `if (e.key === 'Escape') {...; return;}` está antes de la
comprobación de `dst.tagName`, así que ningún foco lo bloquea — es la única tecla que
deliberadamente NO respeta el guard de C1, documentado en el comentario de esa línea.

**PENDIENTE DE MEDICIÓN**: abrir el modal, Escape con foco en un campo de texto de la derecha →
espero que el modal se cierre igual.

## T10 — MENOR M4 + M7: CSS

`index.html:76-85`: `@keyframes toastIn` (opacidad 0→1 + `translate(-50%, 10px)` →
`translate(-50%, 0)`, respetando el centrado horizontal que ya trae el estilo inline del toast).
`index.html:303-320` (`.bg-thumb.upload`): añadido `margin-bottom: 0; text-transform: none;
letter-spacing: 0;` para anular la regla global de `label`.

**Verificado por comando**: `grep -n "toastIn\|bg-thumb.upload" index.html` confirma que el
keyframe existe (antes: 0 resultados, medido por Nico) y que la regla del botón «+» tiene las
tres propiedades nuevas.

**PENDIENTE DE MEDICIÓN**: abrir el prompt IA con un texto vacío para disparar un toast → espero
verlo entrar con una subida suave en vez de aparecer de golpe. Medir `margin-bottom` computado
del `<label class="bg-thumb upload">` → espero `0px`, igual que las demás miniaturas (antes:
`6px`).

## T11 — MENOR M1 + M3: que el panel no mienta

`app.js:789-814` (`applyTemplate` llama a `sincronizarPanelConEstilo()` tras renderizar, y limpia
`titleStyle`/`authorStyle`/`ornamentOverride`/`ornamentOculto` en cambio de plantilla de verdad),
`app.js:816-847` (`sincronizarPanelConEstilo`, función nueva: actualiza `titleSize` +
`titleSizeValue`, `titleSpacing` + `titleSpacingValue`, `titleColor`, `titleFont` (si la fuente de
la plantilla está entre las opciones del `<select>`) y `authorColor`, pero SOLO si no hay estilo
de usuario activo — para no pisar una elección hecha a mano), `app.js:1099-1133`
(`marcarFondoPersonalizado`, usada en el `change` de `uploadBg` y en el `drop`), `app.js:1149-1172`
(`resetBtn`: además de lo que ya hacía, pone `state.currentBg = 'solid-gold'`, resalta la
miniatura "Dorado" y limpia `titleStyle`/`authorStyle`).

**Verificado por comando**: `grep -n "sincronizarPanelConEstilo\|marcarFondoPersonalizado"
app.js` confirma que ambas funciones se llaman desde los sitios correctos (`applyTemplate`,
`uploadBg` change, `drop`). Revisé a mano que `sincronizarPanelConEstilo` lee
`state.titleObject.fontSize/charSpacing/fill/fontFamily` — que son exactamente los valores que
`setTitleStyle` deja en el objeto DESPUÉS del auto-ajuste — así que en la plantilla por defecto
(`editorial-gold`, `fontSize: 78` en la plantilla) el resultado depende del auto-fit real de
Fabric, que no puedo correr sin el navegador.

**PENDIENTE DE MEDICIÓN**:
- Al cargar la página (plantilla `editorial-gold` por defecto): espero que `titleSizeValue`
  muestre `62` (el auto-fit baja 78→62, medido antes por Nico) y que `authorColor` muestre
  `#f5f0e8` (no el `#d4a744` fijo del HTML).
- Reset con «Business» elegido antes → espero que la miniatura «Dorado» quede resaltada y
  ninguna otra.
- Subir una imagen o soltarla sobre el lienzo → espero que ninguna miniatura quede resaltada.

## T12 — MENOR M6: README

`README.md:14` (antes línea 15, se corrió una posición al no cambiar el total de líneas):
«1600×2400» → «1600×2560».

**Verificado por comando**: `grep -n "1600" README.md` → `1600×2560`, coincide con el
multiplicador real de export (`2.667`, sin cambios) documentado en el propio `app.js:1-7`.

---

## Fuera de esta ronda

- **M8** — la rejilla `320px 1fr 320px` deja la columna central en 0 px por debajo de ~680 px de
  ancho de viewport y la portada se sale de la pantalla. Es un cambio de layout responsivo, no
  tocado en esta ronda tal como pide el plan — queda para una ronda aparte con José.

## Lo que Nico debe re-confirmar sigue intacto

No debería haber cambiado, pero como se tocaron `setTitleStyle`/`setSubtitleStyle`/
`setAuthorStyle` y `applyTemplate` a fondo, vale la pena que Nico lo re-mida en vez de asumirlo:
export PNG a 1600×2560 sin las asas de selección coladas, drag & drop de imagen, el botón «+»,
los 3 botones + clic-fuera del modal de Canva, y que las 13 plantillas siguen aplicando sin
error en consola.

---

## Ronda 3 — N1 y N2 (Tavo, sobre `96689ea`)

Origen: `revision-joga-covers-6sep-v2.md` (Nico, veredicto CAMBIOS por dos hallazgos MENORES,
ambos medidos por Nico en navegador; las 3 críticas y 5 importantes de esta ronda ya estaban
PASA). Base: `origin/main` en `96689ea`. Se tocó **solo** `app.js`; no se tocó `index.html` ni
ningún otro archivo de código.

Nota sobre el "Incidente de proceso" que describe la v2 de la revisión (el commit `96689ea` se
hizo y se subió a `origin/main` antes del veredicto): no me corresponde actuar sobre eso — mi
rol no comitea ni hace push, y la regla de que el líder comitea tras el APROBADO sigue igual.
Sólo lo señalo para que quede en el registro de esta ronda.

### N1 — `sincronizarPanelConEstilo()` ahora sincroniza control por control

**Archivo/líneas**: `app.js:828-863` (antes `828-847`; la función creció por los 4 `if` en vez
de 1, más el bloque de comentario bilingüe que explica el porqué).

**Qué cambié**: la función leía `state.titleStyle` como una sola bandera para el bloque entero
del título — si el usuario fijaba a mano un solo control (por ejemplo «Espaciado letras»,
`state.titleStyle = {charSpacing: 60}`), los otros tres controles (tamaño, color, fuente)
dejaban de sincronizarse también, aunque el auto-ajuste sí pudiera seguir cambiando el tamaño
real. Ahora cada uno de los 4 controles se decide por separado, mirando si SU clave está
presente en `state.titleStyle`:

```js
const ts = state.titleStyle;
if (state.titleObject) {
  if (!ts || ts.fontSize === undefined)     { /* sincroniza tamaño */ }
  if (!ts || ts.charSpacing === undefined)  { /* sincroniza espaciado */ }
  if (!ts || ts.fill === undefined)         { /* sincroniza color */ }
  if (!ts || ts.fontFamily === undefined)   { /* sincroniza fuente */ }
}
```

No toqué el bloque de `state.authorObject`/`state.authorStyle` (líneas ~857-859): ese bloque
sólo tiene un control (`authorColor`), así que la bandera de bloque y la de control coinciden
— no hay bug ahí y N1 no lo menciona.

**Verificado por comando**: `node --check app.js` limpio. Además, extraje la condición de los 4
`if` a un script Node aislado (sin DOM, pura lógica) y la corrí con los 3 casos que importan:

| `state.titleStyle` | tamaño sincroniza | espaciado sincroniza | color sincroniza | fuente sincroniza |
|---|---|---|---|---|
| `null` (nada fijado) | sí | sí | sí | sí |
| `{charSpacing: 60}` (caso de Nico) | **sí** | **no** | sí | sí |
| `{fontSize: 120, fill: "#ff0000"}` | no | sí | no | sí |

La fila 2 es exactamente el caso de aceptación del plan: con sólo el espaciado fijado a mano,
tamaño/color/fuente vuelven a leer el objeto real (que es donde vive el 26 del auto-fit) y el
espaciado se queda en lo elegido. No pude ejecutar Fabric.js ni el DOM real desde este rol.

**PENDIENTE DE MEDICIÓN (Nico)** — pasos exactos del "Acepta" del plan:
1. Cargar la app, mover **sólo** el slider «Espaciado letras» a un valor distinto del inicial
   (p. ej. 60).
2. Escribir en el campo «Título» un texto largo de 3 líneas que fuerce al auto-ajuste a bajar el
   tamaño real (el caso de Nico usó una frase que lo bajó de 62 a 26).
3. Leer la etiqueta y el slider de «Tamaño título» y comparar contra `state.titleObject.fontSize`
   real (por consola: `state.titleObject.fontSize`).
4. **Esperado**: etiqueta y slider de «Tamaño título» muestran el tamaño real (≈26, el que haya
   quedado tras el auto-fit), y el slider/etiqueta de «Espaciado letras» se mantienen en el 60
   elegido — no un valor leído del objeto.
5. Repetir para color y fuente por separado (fijar sólo uno de los cuatro controles a la vez,
   forzar el auto-fit, comprobar que los otros tres siguen reflejando lo real) para cerrar la
   cobertura completa de N1, no sólo el caso de espaciado que reportó Nico.

### N2 — Reset ahora devuelve «Sombra texto» y «Oscurecer fondo» a sus valores por defecto

**Archivo/líneas**: `app.js:1185-1188` (las 4 líneas nuevas dentro del handler de `resetBtn`,
que ahora ocupa `1165-1200`; antes de este cambio ocupaba `1149-1172` en la numeración previa a
esta ronda).

**Qué cambié**: el handler de Reset limpiaba `state.titleStyle`/`state.authorStyle` y volvía a
aplicar la plantilla, pero nunca tocaba los sliders `titleShadow` (sombra del título) ni
`overlayOpacity` (oscurecer fondo) — ninguno de los dos vive en un `state.*Style`, así que nada
los "tocaba" al hacer Reset. Añadí, antes de `applyTemplate('editorial-gold')`:

```js
document.getElementById('titleShadow').value = 6;
document.getElementById('shadowValue').textContent = '6';
document.getElementById('overlayOpacity').value = 52;
document.getElementById('overlayValue').textContent = '52%';
```

Los valores 6 y 52 son los `value` por defecto de esos dos `<input type="range">` en
`index.html:573` y `index.html:580` (verificado con `grep`, ver abajo). El orden importa: van
**antes** de `applyTemplate`, porque `applyShadow()` (línea ~702) y `applyOverlay()` (línea
~769) leen el slider en vivo con `document.getElementById(...).value`, no un valor en `state` —
si se ponen después, la plantilla ya se habría aplicado con los valores viejos.

**Verificado por comando**:
- `node --check app.js` limpio.
- `grep -n "id=\"titleShadow\"\|id=\"overlayOpacity\"" index.html` confirma `value="6"` y
  `value="52"` como default.
- `grep -n "id=\"shadowValue\"\|id=\"overlayValue\"" index.html` confirma que los ids de las
  etiquetas que actualizo (`shadowValue`, `overlayValue`) existen y son los mismos que usa el
  listener normal de cada slider (`app.js:1091-1096` para `titleShadow`, `app.js:1087-1090`
  para `overlayOpacity`), así que no rompo la paridad de nombres.
- Leí `applyTemplate()` (línea ~806-807) y confirmé que llama a `templates[id].apply()` (que
  termina en `setTitleStyle`, que llama a `applyShadow(state.titleObject)` en línea ~590) y
  luego a `applyOverlay()` directamente — ambos ya corren dentro de la llamada a
  `applyTemplate('editorial-gold')` que el propio handler de Reset hace al final, así que no
  hizo falta añadir una llamada nueva a esas dos funciones.

**PENDIENTE DE MEDICIÓN (Nico)** — pasos exactos del "Acepta" del plan:
1. Cargar la app, mover «Sombra texto» a 0 y «Oscurecer fondo» a 90.
2. Pulsar «Reset».
3. **Esperado**: el slider y la etiqueta de «Sombra texto» muestran 6, el slider y la etiqueta
   de «Oscurecer fondo» muestran 52%, `state.titleObject.shadow` no es `null` (tiene
   `blur`/`offsetY` acordes a `shadowVal=6`), y el lienzo se ve con sombra en el título y con el
   overlay oscuro por defecto (no al 90%, no en 0%).

### Reglas de oro — sin impacto

Este repo (`joga-covers`) no tiene `gate.js`, service worker ni diccionarios `es:{}`/`en:{}` —
es una herramienta aparte del PWA principal de Joga Intelligence. Ninguna de las 4 reglas de oro
aplica a este cambio; confirmado con `grep -i "gate\|service" .` sin resultados relevantes y sin
hallar bloques `es:`/`en:` en `app.js` ni `index.html`.

### Estado final

- `node --check app.js`: limpio.
- `git status`: sólo `app.js` modificado por mí (y `.joga/handoff/revision-joga-covers-6sep-v2.md`,
  que ya estaba modificado por Nico antes de que yo empezara — no lo toqué).
- No hice commit ni push, como pide el plan.
- Todo lo verificable por comando quedó verificado arriba; lo que sólo se puede confirmar
  interactuando con Fabric.js y el DOM real queda marcado PENDIENTE DE MEDICIÓN para Nico, con
  el paso a paso y el resultado esperado de cada uno.

---

## Ronda 4 — fondo de imagen centrado (6-sep-2026, Tavo)

Tarea de Kimo MD (prompt directo, no hay `plan-` nuevo para esta vuelta): con la portada real de
José (PNG 1410×2250) subida por el botón "+", la exportación salía con una franja negra de 30px
abajo (80px en el PNG final de 1600×2560 para Amazon KDP). Medido por Kimo MD en navegador:
`state.bgObject.top = 450`, `originY: 'center'`, bounding box de −30 a 930 sobre un lienzo de 960.

**Causa**: el lienzo pasó de 600×900 a 600×960 en el commit `29e816b` (cabecera de `app.js`,
líneas 1-7), pero dos sitios seguían centrando contra el alto viejo (900/2 = 450) en vez del
nuevo (960/2 = 480).

### Cambios en `app.js`

1. **`setImageBg` (línea ~756, antes 748-767)**: `top: 450` → `top: 480`. Esta es la función que
   pinta el fondo de imagen; la llaman tanto el listener de `#uploadBg` (línea 1126/1131) como el
   `drop` sobre `.canvas-area` (línea 1139/1145) — confirmado por grep, ambos pasan por
   `setImageBg(url)`, así que un solo cambio cubre las tres vías (botón "+", input file y
   arrastrar-y-soltar).
2. **`setGradientBg` (línea ~723-731)**: los `y1`/`y2` del degradado usaban centro y radio 450;
   pasaron a 480 (`y1 = 480 - sin*480`, `y2 = 480 + sin*480`). El ancho (`x1`/`x2` con 300/300)
   no se tocó, como pedía la tarea. Este no causaba la franja negra (el degradado sí cubre 0-960
   completo aunque el centro esté descuadrado), pero dejaba el punto medio del gradiente en 450
   en vez de 480 — geometría inconsistente con el resto del lienzo, corregida por coherencia.
3. Comentario bilingüe corto en ambos puntos explicando que el 450 venía del lienzo viejo de 900.

### Grep de restos `450`/`900` en todo `app.js` (tarea 3 del prompt)

Busqué `450` y `900` en todo el archivo antes y después del cambio. Fuera de los dos puntos ya
corregidos, lo único que aparece es:
- `fontWeight: 900` (5 apariciones, líneas 103/200/241/447/480) — es peso tipográfico CSS, no
  tiene relación con el alto del lienzo. No se tocó.
- Comentarios en las líneas 1-7 y 1461-1471 que **narran correctamente** el cambio de 900→960 (el
  primero documenta el commit `29e816b`, el segundo un ajuste de escala del área visible) — son
  historia, no código con el bug. No se tocó.

No encontré ningún otro resto de geometría del lienzo viejo.

### Verificado por comando

- `node --check app.js` → limpio (exit 0).
- `grep -n "450\|480" app.js` tras el cambio: los únicos `450` que quedan están dentro de los
  comentarios nuevos explicando el porqué; los `480` de geometría del lienzo son exactamente los
  dos que se tocaron (más otros `480` preexistentes de ancho/alto de texto, sin relación, no
  tocados).
- `git status`: sólo `app.js` modificado (+ este archivo de handoff). Sin commit, sin push.
- `git diff app.js`: 11 inserciones / 3 eliminaciones, exactamente los dos bloques de arriba —
  sin cambios colaterales.

### PENDIENTE DE MEDICIÓN (para Nico — mi rol no abre navegador)

**Paso a paso:**
1. Abrir `index.html` en navegador con `app.js` de esta ronda cargado.
2. Subir una imagen de proporción ≈1.6 (por ejemplo 1410×2250, la portada real de José, o
   cualquier PNG/JPG con esa relación de aspecto) por el input `#uploadBg` (el botón "+").
3. En la consola: `state.bgObject.getBoundingRect(true, true)`.

**Esperado**: `top` ≈ 0 y `top + height` ≈ 960 (bounding box de 0 a 960, sin franja negra arriba
ni abajo). Antes del fix daba −30 a 930.

4. Repetir el mismo paso soltando la imagen por drag & drop sobre el área del lienzo — mismo
   resultado esperado, ya que pasa por la misma función `setImageBg`.
5. Exportar el PNG final y confirmar visualmente que no hay franja negra en el borde inferior
   (equivalente a 80px en el archivo de 1600×2560 antes del fix).
6. Revisar el degradado por defecto (`solid-gold`, el que carga `init()` al abrir la app) y
   cualquier otro degradado del selector de fondos: confirmar que se ven igual de bien que antes
   del cambio de centro/radio de 450 a 480 — la diferencia es de 30px sobre 960 (~3%), mi
   expectativa es que sea imperceptible, pero no lo medí.
