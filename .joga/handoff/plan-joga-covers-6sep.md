# Plan — joga-covers, ronda 6-sep-2026 (para Tavo)

Origen: `revision-joga-covers-6sep.md` (Nico, veredicto CAMBIOS). Léelo entero antes de tocar nada:
cada punto de abajo tiene ahí su medición y su línea exacta.

Objetivo: que TODOS los controles de Joga Covers hagan lo que el panel dice, y que nada de lo que el
usuario cambia a mano (posición, ancho, fuente, color, tamaño, espaciado, texto editado en el lienzo,
ornamento) se pierda al escribir una letra o tocar otro control. José pidió literalmente
«que quede bien» y «checa que todos los botones estén funcionales».

## Reglas de esta ronda

- NO hagas commit ni push. El líder comitea después del APROBADO de Nico.
- Toca sólo `app.js`, la sección `<style>` de `index.html` y `README.md`.
- Mantén el estilo de comentarios bilingüe ES / EN que ya usa el archivo.
- El working tree ya trae un cambio SIN comitear (el listener `keydown` de Delete/Backspace,
  `app.js` ~761-774). Construye encima, no lo deseches.
- Al terminar: `node --check app.js` limpio, consola del navegador sin errores al cargar.
- Para probar, levanta el servidor DESDE el scratchpad:
  `python3 -m http.server 8778 --directory /Users/joseogallardo/Documents/GitHub/joga-covers`
  y mátalo por PID verificado al final. El repo debe terminar con `git status` mostrando sólo los
  archivos que se pretendía tocar.
- Reporte en `.joga/handoff/implementacion-joga-covers-6sep.md`. Créalo AL PRINCIPIO con estado
  `EN CURSO` y añade cada tarea en cuanto la termines y la midas; no lo dejes para el final.

## Tareas (en este orden)

### T1 — CRÍTICO C1: el `keydown` global no debe actuar sobre campos de texto
`app.js` ~761-774. Al inicio del handler, salir si el evento viene de un `INPUT`, `TEXTAREA`,
`SELECT` o `isContentEditable`, y también si el modal de Canva está abierto
(`canvaModal.classList.contains('active')`).
Acepta: título seleccionado en el lienzo → clic en el campo «Título» con `ABCDEF` → Backspace deja
`ABCDE` (no `""`). Con el modal abierto, Backspace no toca el título. Sin foco en un campo y con
el título seleccionado por fuera, Delete sigue vaciándolo (lo que ya funciona).

### T2 — CRÍTICO C2 + C3: el portapapeles no existe en contexto no seguro
`app.js` ~978 (iaGenerate) y ~1036 (modalContinue). `navigator.clipboard` es `undefined` en
`file://` y por IP local: `.writeText` lanza un `TypeError` SÍNCRONO y el `.catch()` nunca corre.
Escribe un helper `copiarAlPortapapeles(texto)` que devuelva una promesa que resuelve `true`/`false`
y NUNCA rechace: si falta `navigator.clipboard` o `.writeText`, o si la llamada lanza, resuelve
`false`. Úsalo en los dos sitios:
- iaGenerate: si `false` → `window.prompt('Copia manualmente:', promptText)` y luego `window.open`.
- modalContinue: siga siempre al `setTimeout` (abrir Canva, cerrar modal, toast); si la copia falló,
  que el toast lo diga («Portada descargada · Abriendo Canva» sin «Título copiado»).
Corrige el comentario de ~968-972: decía que cubría «http sin TLS» y no lo cubría.
Acepta: en consola `navigator.clipboard = undefined` y luego clic en cada botón → iaGenerate abre
`window.prompt` y `window.open`; modalContinue descarga, abre Canva, cierra el modal y muestra toast.
Sin errores en consola.

### T3 — IMPORTANTE I1: la tipografía elegida se revierte al escribir
`app.js` ~848-879 contra ~844-846. Los handlers de `titleFont`, `titleColor`, `titleSize`,
`titleSpacing` y `authorColor` escriben directo sobre el objeto y el siguiente `applyTemplate()`
lo recrea con los valores de la plantilla. Guarda cada elección en `state` (p. ej.
`state.titleStyle = { fontFamily, fill, fontSize, charSpacing }`, `state.authorStyle = { fill }`)
y aplícala en `setTitleStyle` / `setAuthorStyle` DESPUÉS de construir el objeto (el tamaño elegido
por el usuario gana sobre el auto-ajuste: lo eligió él). Limpia esos estilos igual que los
overrides de posición: sólo al cambiar de verdad de plantilla o con Reset.
Acepta la tabla de Nico: Bebas Neue / 120 / `#ff0000` / 200 en el título, escribir UNA letra, y
los cuatro valores siguen en el lienzo y coinciden con el panel. Lo mismo para el color del autor.

### T4 — IMPORTANTE I2: el snapshot de `object:modified` no guarda `width`
`app.js` ~741. Añade `width` al snapshot (las asas laterales de un Textbox cambian `width`, no
`scaleX`). Acepta: arrastrar la asa derecha del título de 520 a 440 → escribir una letra → sigue
en 440 y centrado (bbox centrada en x=300, nada fuera de la portada).

### T5 — IMPORTANTE I3: borrar el título deja una caja fantasma
`app.js` ~505-564. `setTitleStyle` necesita el mismo `if (!text) return;` que subtítulo y autor, y
las tres funciones deben poner `state.xObject = null` cuando salen sin crear objeto (ahora dejan
la referencia vieja de un objeto ya quitado del lienzo). Acepta: borrar el título con Delete →
`canvas.getObjects()` no contiene ningún textbox vacío; clic en (300,420) y (150,430) no
selecciona nada.

### T6 — IMPORTANTE I4: la sombra no se puede quitar
`app.js` ~631-641. `applyShadow` sólo pone; añade el `else obj.set('shadow', null)`.
Acepta: slider a 20 → blur 40; slider a 0 → `shadow === null` sin escribir nada más.

### T7 — IMPORTANTE I5: editar el texto en el lienzo se pierde
Los tres `setXStyle` leen SIEMPRE del input. Añade `canvas.on('text:changed', …)` que escriba
`target.text` en el input correspondiente (título/subtítulo/autor) SIN disparar el evento `input`
(para no recrear el objeto en medio de la edición). Acepta: doble clic en el título, cambiar el
texto, clic fuera, escribir en «Subtítulo» → el título del lienzo conserva el texto editado y el
campo «Título» lo muestra.

### T8 — MENOR M2: el ornamento (◆ ❦ ★…) pierde el arrastre y Delete no lo borra
`app.js` ~610-622 y el `keydown`. Incluye `state.ornamentObject` en el snapshot de
`object:modified` (`state.ornamentOverride`, aplicado en `addOrnament`) y en el handler de
Delete: al borrarlo, marca `state.ornamentOculto = true` para que `addOrnament` no lo vuelva a
pintar hasta cambiar de plantilla o Reset. Acepta: arrastrar el ornamento de top 340 a 440 →
escribir una letra → sigue en 440. Seleccionarlo y Delete → desaparece y no vuelve al escribir.

### T9 — MENOR M5: Escape cierra el modal de Canva
En el mismo `keydown` (o uno aparte): `Escape` con el modal abierto lo cierra, INCLUSO con el
foco en un campo (no lo bloquee el guard de T1). Acepta: abrir modal, Escape, modal cerrado.

### T10 — MENOR M4 + M7: CSS
- Añade `@keyframes toastIn` en `index.html` (el toast en `app.js` ~1067 usa
  `animation: toastIn 0.3s ease-out` y no existe): una entrada suave (opacidad 0→1, leve subida).
- `.bg-thumb.upload { margin-bottom: 0; text-transform: none; letter-spacing: 0; }` para que el
  `<label>` del «+» no herede la regla global de `label` (`index.html` ~325-332).
Acepta: medido `margin-bottom: 0px` en el «+», igual que las demás miniaturas.

### T11 — MENOR M1 + M3: que el panel no mienta
- Reset (`app.js` ~925-934): además de lo que hace, poner `state.currentBg = 'solid-gold'`,
  actualizar el resaltado de `.bg-thumb`, limpiar `state.titleStyle/authorStyle` y devolver
  selects, sliders y color pickers a los valores por defecto de `index.html`.
- Al subir una imagen (botón «+» o arrastrar al lienzo): `state.currentBg = 'custom'` y quitar el
  resaltado de todas las miniaturas (ninguna corresponde).
- Tras cada `applyTemplate`, si NO hay estilo de usuario activo, sincronizar el panel con lo
  realmente aplicado: slider+etiqueta «Tamaño título» = `state.titleObject.fontSize` (hoy dice 72
  y es 62), `titleColor` = fill del título, `authorColor` = fill del autor, `titleSpacing` =
  charSpacing, `titleFont` = fontFamily si está entre las opciones.
Acepta: al cargar, la etiqueta dice 62 y el color de autor muestra `#f5f0e8`; tras Reset con
«Business» elegido, la miniatura «Dorado» es la resaltada.

### T12 — MENOR M6: README
`README.md:15`: «1600×2400» → «1600×2560» (es lo que exporta de verdad desde `29e816b`).

## Fuera de esta ronda (anotar como pendiente, no hacer)
- M8: por debajo de ~680 px de ancho la rejilla `320px 1fr 320px` deja la columna central en 0 y
  la portada se sale. Es un cambio de layout responsivo; va en una ronda aparte con José.

## Criterios de aceptación globales
- Todos los «Acepta:» de arriba medidos en el navegador y anotados en el reporte con el número.
- `node --check app.js` OK; 0 errores en consola al cargar; los 29 ids siguen existiendo.
- Lo que Nico verificó que SÍ pasa sigue pasando: export 1600×2560, drag & drop, «+», modal.
- `git status`: sólo `app.js`, `index.html`, `README.md` y los archivos de `.joga/handoff/`.
