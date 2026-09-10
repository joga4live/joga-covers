# Revisión v3 — joga-covers, 6 sep 2026 (Nico) — tercera vuelta (N1 y N2)

**Veredicto: APROBADO**

Los dos defectos menores de la v2 (N1 y N2) están arreglados y **medidos en navegador real**, con
prueba de control en cada uno. No encontré ninguna regresión en lo que ya funcionaba. Este cambio
se puede comitear y publicar.

Repo: `/Users/joseogallardo/Documents/GitHub/joga-covers`
Auditado: el árbol de trabajo (`app.js` +41/−16 sobre `96689ea`). `origin/main` = `96689ea`.
Origen: `revision-joga-covers-6sep.md` (v1) → `plan-joga-covers-6sep.md` (T1-T12) →
`implementacion-joga-covers-6sep.md` (Tavo, incluida su sección «Ronda 3 — N1 y N2») →
`revision-joga-covers-6sep-v2.md` (v2, CAMBIOS).

Auditoría en **SOLO LECTURA**. Lo único que escribí es este archivo. El servidor de prueba se
levantó **fuera del repo** (lanzado desde el scratchpad, `python3 -m http.server 8780 --directory`
apuntando al repo) y se mató por **PID verificado (11573)**: confirmé el `args` completo del
proceso antes de matarlo, y después que el PID había desaparecido y que el puerto 8780 ya no
respondía. No creé ningún `launch.json` ni ningún otro archivo dentro del repo.

---

## Alcance — limpio

`git status` al terminar:

```
 M .joga/handoff/implementacion-joga-covers-6sep.md   (Tavo, su sección Ronda 3)
 M .joga/handoff/revision-joga-covers-6sep-v2.md      (mío: mi reporte v2 terminado)
 M app.js                                             (el cambio auditado)
?? .joga/handoff/revision-joga-covers-6sep-v3.md      (este archivo)
```

Nada fuera de `app.js` y `.joga/handoff/*`. `index.html` **sin tocar** (0 líneas), así que no hay
riesgo de cambio de layout no pedido: el diff es puro JavaScript, ni una regla CSS ni un nodo HTML.

⚠️ **Para Kimo MD antes de comitear**: el `M` de `revision-joga-covers-6sep-v2.md` es **mi reporte
de la v2 terminado**. En `96689ea` quedó comiteado a medio escribir, con «EN CURSO» y sin veredicto
(el incidente que ya describí en la v2). Si comiteas sólo `app.js`, el veredicto de la v2 se queda
publicado como un archivo de 12 líneas que no dice nada. **Incluye ese archivo en el commit.**

---

## N1 — panel de «Tamaño título» al fijar sólo «Espaciado letras» — **PASA**

`app.js:828-863`, `sincronizarPanelConEstilo()`. La bandera `state.titleStyle` ya no protege el
bloque entero del título, sino control por control (`ts.fontSize === undefined`, etc.).

**Prueba de control primero** (sin ella, ningún «PASA» de abajo vale). Con `titleStyle = null`,
escribiendo el título largo *«El Despertar Interior Profundo de la Consciencia Universal
Absoluta»* con **tecleo real**:

| | slider | etiqueta | objeto real |
|---|---|---|---|
| al cargar | 62 | «62» | 62 |
| tras el título largo | **34** | **«34»** | **34** |

El instrumento sí ve bajar el tamaño y sí ve el panel seguirlo. Control válido.

**La prueba.** Fijo **sólo** «Espaciado letras» con un **clic real sobre la pista del slider**
(no un evento sintético): queda en **61**, y `state.titleStyle` pasa a `{"charSpacing":61}` — la
condición exacta del defecto. Después escribo el mismo título largo con tecleo real:

| control | panel (slider) | panel (etiqueta) | objeto en el lienzo | ¿coincide? |
|---|---|---|---|---|
| Tamaño título | **34** | **«34»** | **34** | ✔ muestra el real, no el 62 viejo |
| Espaciado letras | **61** | **«61»** | **61** | ✔ se conserva lo elegido |
| Color título | `#f5f0e8` | — | `#f5f0e8` | ✔ |
| Tipografía | `Fraunces` | — | `Fraunces` | ✔ |

Antes del arreglo el panel se habría quedado en 62 con el lienzo en 34. Ahora dice la verdad.

**El reverso, que es donde el cambio de bandera podía romper algo.** Fijo **sólo** el tamaño
(clic real en el slider → 33, `titleStyle = {"fontSize":33}`) y escribo el título largo:

| control | panel | objeto real | ¿coincide? |
|---|---|---|---|
| Tamaño título | 33 | **33** | ✔ el auto-ajuste **no** pisa la elección del usuario |
| Espaciado letras | 20 | 20 | ✔ sigue el valor real de la plantilla |
| Color / Tipografía | `#f5f0e8` / `Fraunces` | `#f5f0e8` / `Fraunces` | ✔ |

Las dos direcciones funcionan. La bandera por control no aflojó la protección de T3.

---

## N2 — Reset y los sliders de EFECTOS — **PASA**

`app.js:1185-1188`, handler de `resetBtn`. Las cuatro líneas van **antes** de
`applyTemplate('editorial-gold')`, que es lo que hace que `applyShadow()` (lee `titleShadow.value`)
y `applyOverlay()` (lee `overlayOpacity.value`) recojan los valores nuevos. Verificado que los
defaults 6 y 52 son los de `index.html:580` y `index.html:573`.

**Precondición, con clics reales en cada pista de slider**: «Sombra texto» → **0**
(`state.titleObject.shadow === null`), «Oscurecer fondo» → **90** (`rgba(0,0,0,0.9)`).

**Clic real en «Reset»** (verificado por sonda de `mousedown`: aterrizó en `resetBtn`):

| | antes de Reset | después de Reset | esperado |
|---|---|---|---|
| slider «Sombra texto» | 0 | **6** | 6 ✔ |
| etiqueta sombra | «0» | **«6»** | «6» ✔ |
| slider «Oscurecer fondo» | 90 | **52** | 52 ✔ |
| etiqueta overlay | «90%» | **«52%»** | «52%» ✔ |
| `titleObject.shadow` | `null` | **`{blur:12, offsetY:3, rgba(0,0,0,0.6)}`** | sombra viva ✔ |
| overlay en el lienzo | `rgba(0,0,0,0.9)` | **`rgba(0,0,0,0.52)`** y presente en `canvas` | ✔ |

`blur:12` y `offsetY:3` son exactamente `6*2` y `6/2`, la fórmula de `applyShadow` — la sombra no
sólo «existe», tiene el tamaño del valor por defecto.

**Y en píxeles rasterizados**, no sólo en objetos. Muestra del fondo dorado en el punto (60,60)
del lienzo:

| estado | RGB | luminancia |
|---|---|---|
| overlay 90 (antes de Reset) | `[23,19,10]` | **19** |
| tras Reset | `[111,92,48]` | **93** |

Y ese `[111,92,48]` es **idéntico byte a byte** a la muestra tomada en un Reset anterior con
overlay 52, así que el lienzo vuelve de verdad al aspecto por defecto, no a un valor parecido.

Reset además devolvió título, plantilla (`editorial-gold`), fondo (`solid-gold`), tamaño (62) y
espaciado (20) a su estado inicial.

---

## No-regresión — todo pasa

| prueba | resultado |
|---|---|
| Escribir en los **tres campos** (tecleo real) | Título, subtítulo y autor llegan al lienzo. Autor en mayúsculas (`Joga` → `JOGA`), como debe. Panel de tamaño 68 = objeto real 68. |
| **Arrastre del título** | De `top 380` a `top 501.2`; `titleOverride` guardado. Escribí 18 caracteres nuevos después y la posición **siguió en 501.2** — la letra nueva no borra el arrastre. |
| **Export 1600×2560** | Decodifiqué el PNG que produce el botón: **1600×2560 exactos**, nombre `portada-habitos-atomicos-2-<ts>.png`. Intercepté el `click` del `<a download>`, así que **no se descargó ningún archivo a disco**. |
| **Consola al cargar** | **0 errores**, 0 rechazos no capturados. Sólo avisos repetidos de Fabric.js (`CanvasTextBaseline 'alphabetical'`), propios de la librería y presentes desde antes. |
| `node --check app.js` | Limpio. |
| Reglas de oro | Verificadas por mi cuenta, no por el reporte de Tavo: `grep` sobre los 5 HTML y `app.js` → no hay `serviceWorker`, ni `gate.js`, ni `data-i18n`/diccionarios `es:{}`/`en:{}`. Ninguna de las 4 aplica a este repo. |
| Branding | El diff no toca ni una vez `joga`, `logo` ni `emblem`. Intacto. |
| Llaves de `localStorage` | No hay `localStorage` ni `sessionStorage` en el proyecto: no hay progreso de usuario que perder. |

---

## Observación — no bloquea, pero anótala para otra vuelta

Midiendo N1 apareció algo que el razonamiento no había previsto: **con el espaciado subido a 61 y
un título largo, el título sale en 3 líneas**, y el contrato del auto-ajuste (`MAX_LINEAS = 2`,
`app.js:546`) dice 2.

La causa: el bucle de auto-ajuste (`app.js:555-567`) mide con el `charSpacing` **de la plantilla**,
y el `charSpacing` elegido por el usuario se aplica **después**, en `app.js:588`
(`state.titleObject.set(state.titleStyle)`). El texto se ensancha una vez ya decidido el tamaño y
cae una línea más.

**No es una regresión de esta vuelta**: comparé función por función contra `HEAD` y `setTitleStyle`,
`applyShadow`, `applyOverlay`, `setAuthorStyle` y `applyTemplate` son **idénticas byte a byte**. El
diff de esta ronda sólo toca `sincronizarPanelConEstilo` y el handler de Reset.

**Y no rompe nada visible hoy**: medí las cajas y el título termina en `y=500`, el subtítulo empieza
en `y=540` — **40 px de aire**, sin colisión. Por eso no bloquea el APROBADO. Si algún día se sube
más el espaciado o se usa una plantilla con el subtítulo más cerca, sí puede llegar a solaparse.

---

## Lecciones de esta vuelta

Ninguna es de un defecto del código: los dos arreglos entraron limpios. Todas salieron del proceso
y del arnés.

1. **Un instrumento puede entregar el ratón y tragarse el teclado.** El primer navegador que usé
   aterrizaba los clics en coordenadas exactas (lo verifiqué con dos puntos) pero **descartaba en
   silencio todo lo que tecleaba**: la pestaña estaba oculta a nivel de sistema. Sin control, mi
   conclusión habría sido «escribir en el título no hace nada» — un falso CRÍTICO.
   → **Regla: antes de creerse cualquier prueba de tecleo, escribir una cadena conocida en el campo
   y leerla de vuelta. Un clic que funciona no demuestra que el teclado funcione; son dos canales
   distintos y fallan por separado.**

2. **`cmd+a` no seleccionó nada** en el instrumento que sí teclea: el texto se **añadió** al que ya
   había en vez de reemplazarlo. Es la hermana del «Backspace sintético no borra» de la v2.
   → **Regla: para vaciar un campo, triple-clic nativo y escribir encima de la selección. Nunca
   `cmd+a`, nunca `Backspace`.**

3. **El marco del screenshot no es el viewport de la página.** Aquí el screenshot venía en un marco
   de 800×500 mientras la página era de 1440×900: **factor 1.8**. Clicar con coordenadas de página
   habría fallado por 500 px, exactamente la trampa de la v2.
   → **Regla: instalar una sonda de `mousedown` que registre `clientX/clientY`, clicar dos puntos
   conocidos y comprobar que aterrizan en el elemento previsto, antes de usar cualquier coordenada.**

4. **Los `ref_N` mueren al navegar.** Cada recarga los renumera o los invalida; dos lotes fallaron
   por eso.
   → **Regla: `read_page` inmediatamente después de cada recarga, y los clics por `ref` en el mismo
   lote que ese `read_page`.**

5. **Se puede verificar una descarga sin descargar.** Sustituí `HTMLAnchorElement.prototype.click`
   para capturar el `href` y el `download` del `<a>`, pulsé el botón real y decodifiqué el PNG en
   memoria: 1600×2560 confirmados **ejercitando el handler de verdad y sin escribir un byte en
   disco**.
   → **Regla: para auditar un export, interceptar el `<a download>` en vez de descargar. Mide más
   (el handler completo) y ensucia menos.**

6. **El razonamiento decide qué medir; la medición encuentra.** N1 estaba razonado como «un arreglo
   de visualización del panel, sin efecto en el lienzo», y era cierto — pero al medirlo apareció el
   título en 3 líneas con el contrato en 2, que nadie había mirado y que ningún razonamiento sobre
   el diff habría sacado, porque **el código culpable no está en el diff**.
   → **Regla: medir el estado final completo del objeto (líneas, alto, cajas), no sólo el campo que
   el arreglo dice tocar.**

7. **Los bloques «PENDIENTE DE MEDICIÓN» de Tavo funcionaron.** Traía archivo, líneas, el paso a
   paso y el resultado esperado de cada uno; pude ir directo a medir sin reconstruir su intención.
   → **Regla: mantener la convención — el implementador marca explícitamente lo que sólo se puede
   comprobar en navegador, con los pasos exactos y el «esperado». Acorta la vuelta del revisor.**
