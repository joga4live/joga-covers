# Revisión — joga-covers, 6 sep 2026 (Nico)

**Veredicto: CAMBIOS**

Repo: `/Users/joseogallardo/Documents/GitHub/joga-covers`
Auditado: `app.js` (1214 líneas, con el cambio sin comitear aplicado) e `index.html` (622 líneas).
Base: `ebc082d` + working tree.

Auditoría en SOLO LECTURA. No toqué ningún archivo del repo; lo único que escribí es este
reporte. `git status` al terminar sigue mostrando exactamente el mismo `M app.js` (+29 líneas)
que al empezar. El servidor de prueba lo levanté fuera del repo
(`python3 -m http.server 8777 --directory <repo>`, lanzado desde el scratchpad) y lo maté por
PID exacto (8259), verificando antes el `command` completo del proceso.

Casi todo lo de abajo está **medido en el navegador**, no razonado. Antes de creer cualquier
medición corrí pruebas de control (están anotadas). Dos veces el instrumento me mintió primero;
lo cuento en «Lecciones».

---

## CRÍTICO

### C1 — El nuevo listener de teclado borra el título entero mientras escribes en el campo de texto
`app.js:761-774` (el cambio SIN COMITEAR, arreglo #4)

El listener está en `document` y no comprueba **dónde** está el foco. Fabric no suelta el objeto
activo cuando haces clic en un `<input>` de HTML, así que basta esta secuencia — que es
exactamente la que hace cualquiera:

1. haces clic en el título sobre el lienzo (para moverlo, para verlo),
2. te vas al campo «Título» de la derecha a corregir una letra,
3. pulsas Backspace.

Resultado: se borra **el campo completo**, no una letra. Y el `e.preventDefault()` de la línea
770 impide además el borrado normal del carácter.

Medido con una tecla real (CDP, no evento sintético): campo con `"ABCDEF"`, un Backspace,
campo queda en `""` y el texto del lienzo en `""`.
Con `Delete` pasa lo mismo. Control del instrumento: sin objeto activo, el mismo Backspace deja
el campo intacto (`"El Despertar Interior"`) y `defaultPrevented === false` — o sea, el
instrumento no está inventando el fallo.

También dispara con el modal de Canva abierto: medido, borra el título por detrás del modal.

**Qué falta:** salir del handler si el evento viene de un campo editable. Algo como
`const dst = e.target; if (dst && (dst.tagName === 'INPUT' || dst.tagName === 'TEXTAREA' || dst.isContentEditable)) return;`
antes de mirar el objeto activo.

Esto es una regresión *nueva*, introducida por el arreglo #4. Tal como está, es peor que el bug
que arregla: el bug original era «no pasa nada», éste es «pierdo lo que había escrito».

### C2 — El botón de Higgsfield SIGUE tronando en silencio en contexto no seguro
`app.js:978` (arreglo #2, commit `8ad19da`)

El renombre de `prompt` → `promptText` era necesario, pero **no era el fallo completo**. En un
contexto no seguro (`file://`, o `http://192.168.x.x:8955` desde el celular) `navigator.clipboard`
no existe: es `undefined`. Entonces `navigator.clipboard.writeText(...)` lanza un `TypeError`
**síncrono**, antes de que exista promesa alguna, así que el `.catch()` de la línea 983 **nunca
se ejecuta**: ni `window.prompt` de respaldo, ni Higgsfield abierto, ni aviso.

Medido: con `navigator.clipboard` puesto en `undefined` (que es literalmente lo que hace el
navegador en contexto no seguro), al pulsar el botón:
- `Uncaught TypeError: Cannot read properties of undefined (reading 'writeText')`
- `window.open` llamado: 0 veces
- `window.prompt` llamado: 0 veces

El comentario de las líneas 968-972 dice que el arreglo cubre «http sin TLS». **No lo cubre.**
Ése es justo el caso que sigue roto — hay que corregir el comentario además del código.

Alcance honesto: en la demo (`https://joga4live.github.io/joga-covers/`) y en `localhost` el
contexto **sí** es seguro y el botón funciona. Duele en `file://` (abrir el index con doble clic)
y en pruebas por IP de red local desde el celular.

**Qué falta:** comprobar antes, p. ej. `if (!navigator.clipboard || !navigator.clipboard.writeText) { window.prompt(...); window.open(...); return; }`, o envolver la llamada en `try/catch` además del `.catch()`.

### C3 — «Descargar y abrir Canva» descarga el PNG y luego se queda colgado (mismo motivo)
`app.js:1036`

`navigator.clipboard.writeText(clipboardText).catch(() => {})` tiene el mismo defecto, y aquí el
daño es mayor porque el `TypeError` aborta el handler **a media faena**: el PNG ya se descargó
(línea 1029) pero el `setTimeout` de la línea 1042 nunca llega a correr.

Medido en contexto no seguro simulado:
- descarga disparada: `joga-cover-el-despertar-interior…png` ✓
- `window.open` (Canva): **0 veces**
- modal: **sigue abierto**
- toast de confirmación: **no aparece**
- consola: `Uncaught TypeError: … (reading 'writeText')`

El usuario ve el archivo bajando y un modal que no se cierra. Eso es «no funciona» en la boca de
José. Mismo arreglo que C2.

---

## IMPORTANTE (no rompe la app, pero es lo que el usuario llama «no funciona»)

### I1 — Los 4 controles de tipografía se deshacen solos en cuanto escribes una letra
`app.js:848-879` frente a `app.js:844-846`

El arreglo #1 (`d565b9c`) guardó la **posición** en overrides, pero no el estilo. `titleFont`,
`titleColor`, `titleSize` y `titleSpacing` escriben directo sobre el objeto y no dejan rastro en
`state`, así que el siguiente `applyTemplate()` (una letra en cualquiera de los tres campos) los
revierte a los valores de la plantilla. Los controles de la UI siguen mostrando lo que el usuario
eligió: el panel miente.

Medido, título:

| | fuente | tamaño | color | espaciado |
|---|---|---|---|---|
| inicial | Fraunces | 62 | `#f5f0e8` | 20 |
| tras tocar los controles | Bebas Neue | 120 | `#ff0000` | 200 |
| **tras escribir UNA letra** | **Fraunces** | **62** | **#f5f0e8** | **20** |
| lo que sigue mostrando el panel | Bebas Neue | 120 | `#ff0000` | 200 |

Es el mismo defecto que José reportó (arreglo #1), sin arreglar para el estilo. Sospecho que es
buena parte del «el botón no funciona» original: eliges Bebas Neue, escribes, vuelve a Fraunces.

Lo mismo aplica a `authorColor` (`app.js:860`).

### I2 — El arreglo #1 no guarda `width`: redimensionar de lado se pierde Y descoloca el título
`app.js:741`

El snapshot guarda `left, top, scaleX, scaleY, angle`. Pero en Fabric un `Textbox` se
redimensiona **cambiando `width`** con las asas laterales (`ml`/`mr`) — que es justo lo que hace
la gente para que el título quepa. `width` no está en el snapshot.

Medido (arrastre real de la asa `mr` sobre el lienzo):
- ancho antes: 520 → tras arrastrar: **440** ✓ (el arrastre funciona)
- override guardado: `{left: 259.75, top: 380, scaleX: 1, scaleY: 1, angle: 0}` — sin `width`
- tras escribir una letra: ancho **vuelve a 520**, pero el `left: 259.75` guardado **sí** se
  re-aplica.

Resultado medido: la caja del título queda **40 px descentrada** y su borde izquierdo se sale
1 px de la portada (bbox 
`izq: -1, der: 520`, centro 260 contra 300). O sea: no sólo se pierde el redimensionado, encima el
título se mueve solo a un sitio donde el usuario nunca lo puso. Añadir `width` al snapshot.

### I3 — Al borrar el título queda una caja invisible de 521×89 px que se traga los clics
`app.js:505-564` + el arreglo #4

`setSubtitleStyle` y `setAuthorStyle` hacen `if (!text) return;` (líneas 569 y 592).
`setTitleStyle` **no**: con texto vacío igual crea y añade el `Textbox`.

Medido tras borrar el título con la función nueva: `text: ""`, `visible: true`,
bbox `521 × 89.14` en `left 39.5, top 380` — casi el ancho entero de la portada. Clic en
(300, 420) y en (150, 430): ambos seleccionan el título fantasma en vez del fondo.

Es doblemente relevante porque el caso de uso que motiva el arreglo #4 es «subo mi portada de
Canva y borro el texto de encima»: justo después de borrarlo, no puedes hacer clic en tu portada
en esa franja. Falta el mismo `if (!text) return;` (y limpiar `state.titleObject`).

### I4 — La sombra no se puede quitar: el slider a 0 no la borra
`app.js:631-641`

`applyShadow()` sólo actúa `if (shadowVal > 0)`. No hay `else`. Sobre un objeto que ya tiene
sombra, bajar el slider a 0 no la elimina.

Medido: sombra inicial blur 12 → slider a 20 → blur 40 → **slider a 0 → el objeto sigue con
`blur: 40, offsetY: 10`**, mientras la etiqueta de la UI dice «0». Sólo desaparece si por
casualidad escribes otra letra después (ahí se recrea el objeto y `shadow: null` gana).

Falta el `else obj.set('shadow', null)`.

### I5 — Editar el texto directamente en el lienzo se pierde (y el README lo anuncia)
`app.js:506, 567, 590`

Los tres `setXStyle` leen el texto **del input**, nunca del objeto. Si editas el título con doble
clic sobre la portada (lo que el README vende como «edita texto directamente»), el campo de la
derecha no se entera, y en cuanto escribes en cualquiera de los tres campos el texto del lienzo
vuelve al valor del input.

Medido: texto editado a mano en el lienzo → mover el slider «Oscurecer fondo» **no** lo pierde
(sólo llama a `applyOverlay`), pero escribir en «Subtítulo» lo revierte a
`"El Despertar Interior"`. Falta sincronizar `text:changed` → input.

---

## MENOR (real, medido, pero no urgente)

- **M1 — Reset deja el panel mintiendo.** `app.js:925-934`. Medido: con «Business» elegido, Reset
  pone el degradado dorado en el lienzo (`state.bgObject.type: "rect"`) pero la miniatura
  «Business» **sigue resaltada** y `state.currentBg` sigue diciendo `example-business`. Tampoco
  restaura sliders, selects ni color pickers. Lo mismo pasa al arrastrar una imagen al lienzo: el
  resaltado se queda en «Dorado» (medido). El resaltado sólo se actualiza dentro del `onclick` de
  la miniatura (`app.js:800-801`).
- **M2 — El ornamento (◆ ❦ ★ …) sufre el bug #1 sin arreglar, y Delete no lo borra.**
  `app.js:610-622`. Medido: arrastrado de `top 340` a `top 440`; una letra después vuelve a
  `340`. Y con el ornamento seleccionado, Delete no hace nada (el handler nuevo sólo contempla
  título/subtítulo/autor), así que no hay forma de quitarlo salvo cambiar de plantilla. Afecta a
  5 de las 13 plantillas.
- **M3 — Las etiquetas de los sliders mienten al arrancar.** `index.html:533-535`: «Tamaño título»
  dice 72; el tamaño real aplicado en la plantilla por defecto es **62** (medido; el auto-fit lo
  baja desde 78). `index.html:527`: «Color autor» muestra `#d4a744` cuando el autor se pinta
  `#f5f0e8`.
- **M4 — El toast se anima con un keyframe que no existe.** `app.js:1067` usa
  `animation: toastIn 0.3s ease-out`; `grep -n keyframes` sobre todo el repo: **0 resultados**. El
  toast aparece igual (no arranca en `opacity: 0`), sólo se pierde la animación de entrada.
- **M5 — Escape no cierra el modal de Canva.** Medido: los 3 botones (×, Cancelar, Descargar y
  abrir Canva) y el clic en el fondo cierran bien; `Escape` no.
- **M6 — README desactualizado.** `README.md:15` dice «Export a 300 DPI (1600×2400 px)». Medido:
  el PNG real sale **1600×2560** (ratio 1.600), que es lo correcto desde `29e816b`. El README
  quedó con la medida vieja.
- **M7 — Nit de estilo del botón «+».** Al pasar de `<div>` a `<label>` (`ebc082d`) hereda la regla
  global `label { … margin-bottom: 6px; text-transform: uppercase; letter-spacing: .5px }` de
  `index.html:325-332`. Medido: `margin-bottom: 6px` contra `0px` de las demás miniaturas; el
  tamaño de la caja sí queda idéntico (135×202 en ambos), así que sólo sobra un poco de aire
  abajo. Cosmético.
- **M8 — Por debajo de ~680 px de ancho, la portada se sale de la pantalla.** La rejilla es
  `320px 1fr 320px` fija (`index.html:19`); medido a 640 px de ancho de viewport: la columna
  central mide **0 px**, con lo que en `ajustarLienzo` la escala sale negativa y el
  `if (!isFinite(escala) || escala <= 0) return;` (`app.js:1194`) se rinde sin escalar: el lienzo
  se queda a 600×960 y sobresale (medido `y: -172` fuera del área). Es previo a esta ronda y no
  estaba en el plan, pero si José abre esto en el celular o con la ventana a media pantalla, no ve
  la portada.

---

## Lo que verifiqué y SÍ pasa (con la evidencia)

- **Arreglo #3 (botón «+», `ebc082d`): correcto.** El `<label for="uploadBg">` reenvía el clic al
  `<input type="file">` de verdad: puse un listener en el input y al hacer clic en el «+» recibió
  **1** clic. La regla `.bg-thumb.upload { display:flex }` (0,2,0) gana a la regla global
  `label { display:block }` (0,0,1), así que la miniatura no se rompe: medida 135×202, igual que
  las demás.
- **Arreglo #1, la parte de posición: funciona.** Arrastre real del título en el lienzo →
  `object:modified` guarda `{left, top, scaleX, scaleY, angle}` y sobrevive a escribir letras.
  (Lo que no sobrevive es `width`: ver I2.)
- **Arreglo #2, la parte del shadowing: correcta.** Ya no hay una variable `prompt` tapando
  `window.prompt`; la llamada de respaldo es `window.prompt(...)` explícita. (Lo que falta es el
  caso en que `navigator.clipboard` ni existe: C2.)
- **Arreglo #4, el caso para el que se escribió: funciona.** Con el título seleccionado por fuera
  en el lienzo, Delete/Backspace vacía el campo y repinta. Y respeta la edición en línea:
  `obj.isEditing` corta bien. El problema es el foco (C1).
- **Sintaxis JS válida:** `node --check app.js` → OK. `index.html` no tiene scripts inline, sólo
  `<script src="app.js">`.
- **Ningún `getElementById` apunta a un id inexistente:** los 29 ids referenciados en `app.js`
  existen los 29 en `index.html`. Consola en carga limpia: **0 errores**.
- **Los 13 templates y los 12 presets de IA cuadran** con las opciones del `<select>`; los 5
  valores de `canvaPreset` existen los 5 en `canvaLinks`.
- **Export PNG: exacto.** `toDataURL` con `multiplier: 2.667` da **1600×2560** medidos (ratio
  1.600, lo que pide Amazon KDP). Las asas de selección **no** se cuelan en el export (medido el
  píxel donde estaría el asa izquierda: `[98,76,33,255]`, color de fondo). Con fondo de imagen del
  propio repo el lienzo **no** queda contaminado por CORS: exporta bien (1207 KB en base64).
- **Clics alineados con el lienzo escalado.** Con la portada a escala 0.833 (500×800 CSS sobre
  600×960 reales), un clic en el centro del título selecciona el título y un clic en zona vacía no
  selecciona nada. La afirmación de `ajustarLienzo` sobre `cssOnly` se sostiene.
- **Drag & drop de imagen: correcto.** Solté un PNG real de 400×640 sobre `.canvas-area`: el fondo
  pasa de `rect` a `image`, escala 1.5, cubriendo exactamente 600×960. El filtro
  `!file.type.startsWith('image/')` está bien puesto.
- **Los 3 botones del modal de Canva y el clic fuera cierran bien** (medido uno por uno).
- **`kdpBtn`** abre `./amazon-kdp-guide.html`, que existe y responde 200.

---

## Lecciones de esta vuelta

1. **Un arreglo que guarda «la posición» tiene que enumerar las propiedades que el usuario puede
   cambiar, no las que uno recuerda.** El snapshot de `object:modified` se escribió de memoria
   (`left, top, scale, angle`) y se olvidó de `width`, que es *la* propiedad que mueven las asas
   laterales de un Textbox. Regla: cuando guardes estado de un objeto manipulable, lista primero
   qué controles existen (`Object.keys(obj.controls)`) y cubre lo que cada uno modifica.
2. **Un listener en `document` es un listener global: hay que preguntar de dónde viene el
   evento.** Todo `keydown` en `document` debe empezar descartando `INPUT`, `TEXTAREA` y
   `contentEditable` antes de hacer nada, salvo que haya una razón explícita para lo contrario.
3. **Arreglar el shadowing de `prompt` no es arreglar el fallback.** Regla: un camino de respaldo
   que nunca se ejecutó en una prueba no está arreglado. Antes de dar por bueno un `.catch()`,
   fuerza el fallo (aquí: `navigator.clipboard = undefined`) y comprueba que el respaldo corre.
   Corolario: `.catch()` no atrapa un `TypeError` lanzado *antes* de que exista la promesa.
4. **Si un commit dice en un comentario qué caso cubre, hay que probar ese caso concreto.** El
   comentario decía «http sin TLS» y ése es exactamente el caso que sigue roto. Un comentario
   equivocado es peor que ninguno: la próxima sesión lo lee y no vuelve a mirar.
5. **Cuando se arregla un bug de una familia, hay que barrer la familia entera.** «Lo que el
   usuario cambia a mano se pierde al re-aplicar la plantilla» tenía cinco víctimas: posición
   (arreglada), ancho, estilo (fuente/color/tamaño/espaciado), texto editado en el lienzo y
   ornamento. Se arregló una.
6. **Un `if` sin `else` en una función que aplica un efecto no puede quitarlo.** `applyShadow` sólo
   sabe poner. Regla: toda función `aplicarX(valor)` tiene que manejar `valor === 0` / vacío como
   un caso, no como un «no hago nada».
7. **Mi arnés me mintió dos veces, y las dos veces la culpa era del arnés:**
   - La primera medición decía que `ajustarLienzo` no escalaba nada (lienzo a 600×960 saliéndose
     de la pantalla). Era que el panel del navegador estaba a ~640 px de ancho y la columna central
     medía 0. Al fijar el viewport a 1440×900, escala correctamente. **Regla: fijar el tamaño del
     viewport (y el idioma) antes de medir geometría, y anotarlo junto al número.**
   - Intenté comprobar el caso `file://` navegando al archivo y el panel lo abrió como «static
     snapshot», que no ejecuta la página igual. **Regla: si el instrumento cambia el modo de
     ejecución, el resultado no vale; medir el mismo efecto por otra vía** (aquí: quitar
     `navigator.clipboard` a mano, que es literalmente lo que hace un contexto no seguro) **y decir
     en el reporte cuál de las dos cosas se midió.**
   - Por eso todas las mediciones de arriba llevan su prueba de control (clic en zona vacía → no
     selecciona nada; Backspace sin objeto activo → no borra el campo). Sin el control, el «PASA»
     no vale nada.
8. **Al limpiar, matar por PID verificado.** Busqué con `pgrep -f "http.server 8777"`, confirmé el
   `command` completo del PID 8259 antes de mandar la señal, y comprobé después que murió. Nunca
   por coincidencia de dígitos.
9. **Lo que se monta para auditar va fuera del repo.** El servidor se levantó con `--directory`
   apuntando al repo pero lanzado desde el scratchpad; el repo terminó con el mismo `git status`
   con el que empezó.
