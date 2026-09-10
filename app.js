// Joga Covers — editor de portadas
// Canvas 600×960 — exporta a 1600×2560, que es la medida que pide Amazon KDP para
// portada de ebook (proporcion 1.6). Antes era 600×900 -> 1600×2400 (proporcion 1.5):
// Kindle lo reajustaba y recortaba o dejaba bandas. El multiplicador 2.667 NO cambia:
// 600*2.667=1600 y 960*2.667=2560. / Canvas 600×960, exports to 1600×2560, the size
// Amazon KDP asks for an ebook cover (1.6 ratio). It was 600×900 -> 1600×2400 (1.5):
// Kindle re-fitted it, cropping or letterboxing. The 2.667 multiplier is unchanged.

const canvas = new fabric.Canvas('canvas', {
  backgroundColor: '#1a1815',
  preserveObjectStacking: true,
  width: 600,
  height: 960
});

const state = {
  bgObject: null,
  overlayObject: null,
  titleObject: null,
  subtitleObject: null,
  authorObject: null,
  ornamentObject: null,
  currentTemplate: 'editorial-gold',
  currentBg: 'solid-gold',
  // v: overrides de posicion/tamano cuando el usuario arrastra o redimensiona
  // el titulo/subtitulo/autor a mano en el lienzo. Sin esto, escribir una letra
  // mas o tocar cualquier control volvia a crear el objeto desde cero con la
  // posicion fija de la plantilla y el arrastre se perdia sin aviso.
  // / v: position/size overrides for when the user drags or resizes the
  // title/subtitle/author by hand on the canvas. Without this, typing one more
  // letter or touching any control recreated the object from scratch at the
  // template's fixed position, silently discarding the drag.
  titleOverride: null,
  subtitleOverride: null,
  authorOverride: null,
  // T8: igual que titleOverride, pero para el ornamento (◆ ❦ ★…); y
  // ornamentOculto para cuando el usuario lo borra con Delete — addOrnament
  // no debe repintarlo hasta un cambio de plantilla de verdad o Reset.
  // / T8: same idea as titleOverride, but for the ornament (◆ ❦ ★…); and
  // ornamentOculto for when the user deletes it — addOrnament must not
  // repaint it until a genuine template switch or Reset.
  ornamentOverride: null,
  ornamentOculto: false,
  // T3: fuente/color/tamaño/espaciado elegidos a mano en el panel. Sin esto,
  // el siguiente applyTemplate() (una letra escrita en cualquier campo) los
  // revertia a los valores fijos de la plantilla — el panel seguia
  // mostrando lo elegido pero el lienzo volvia atras.
  // / T3: font/color/size/spacing chosen by hand in the panel. Without this,
  // the next applyTemplate() (one letter typed in any field) reverted them
  // to the template's fixed values — the panel kept showing the choice but
  // the canvas snapped back.
  titleStyle: null,
  authorStyle: null,
  lastAppliedTemplate: null
};

// ================================
// TEMPLATES DE PORTADA
// ================================
const templates = {
  'editorial-gold': {
    name: 'Editorial',
    tag: 'Editorial Gold',
    apply: () => {
      setTitleStyle({
        top: 380,
        maxAlto: 144,
        fontSize: 78,
        fontFamily: 'Fraunces',
        fontWeight: 700,
        fill: '#f5f0e8',
        textAlign: 'center',
        charSpacing: 20
      });
      setSubtitleStyle({
        top: 540,
        fontSize: 18,
        fontFamily: 'Cormorant Garamond',
        fontStyle: 'italic',
        fill: '#d4a744',
        charSpacing: 80
      });
      setAuthorStyle({
        top: 890,
        fontSize: 32,
        fontFamily: 'Inter',
        fontWeight: 600,
        fill: '#f5f0e8',
        charSpacing: 120
      });
      addOrnament('◆', 340, 20, '#d4a744');
    }
  },
  'minimal-serif': {
    name: 'Minimalista',
    tag: 'Minimal Serif',
    apply: () => {
      setTitleStyle({
        top: 100,
        maxAlto: 84,
        fontSize: 73,
        fontFamily: 'Playfair Display',
        fontWeight: 900,
        fill: '#1a1815',
        textAlign: 'center',
        charSpacing: 0
      });
      setSubtitleStyle({
        top: 200,
        fontSize: 16,
        fontFamily: 'Inter',
        fontWeight: 300,
        fill: '#3a3530',
        charSpacing: 200
      });
      setAuthorStyle({
        top: 880,
        fontSize: 32,
        fontFamily: 'Inter',
        fontWeight: 400,
        fill: '#1a1815',
        charSpacing: 150
      });
      removeOrnament();
    }
  },
  'monolith': {
    name: 'Monolito',
    tag: 'Monolith',
    apply: () => {
      setTitleStyle({
        top: 380,
        maxAlto: 94,
        fontSize: 92,
        fontFamily: 'Bebas Neue',
        fill: '#f5f0e8',
        textAlign: 'center',
        charSpacing: 100
      });
      setSubtitleStyle({
        top: 490,
        fontSize: 14,
        fontFamily: 'Inter',
        fontWeight: 300,
        fill: '#f5f0e8',
        charSpacing: 500
      });
      setAuthorStyle({
        top: 890,
        fontSize: 32,
        fontFamily: 'Bebas Neue',
        fill: '#f5f0e8',
        charSpacing: 120
      });
      removeOrnament();
    }
  },
  'classic-frame': {
    name: 'Clásico',
    tag: 'Classic Frame',
    apply: () => {
      setTitleStyle({
        top: 380,
        maxAlto: 84,
        fontSize: 78,
        fontFamily: 'Cinzel',
        fontWeight: 600,
        fill: '#f5e9d0',
        textAlign: 'center',
        charSpacing: 60
      });
      setSubtitleStyle({
        top: 480,
        fontSize: 16,
        fontFamily: 'Cormorant Garamond',
        fontStyle: 'italic',
        fill: '#d4a744',
        charSpacing: 100
      });
      setAuthorStyle({
        top: 880,
        fontSize: 32,
        fontFamily: 'Cinzel',
        fontWeight: 400,
        fill: '#f5e9d0',
        charSpacing: 120
      });
      addOrnament('❦', 320, 32, '#d4a744');
    }
  },
  'modern-stack': {
    name: 'Moderno',
    tag: 'Modern Stack',
    apply: () => {
      setTitleStyle({
        top: 350,
        maxAlto: 134,
        fontSize: 84,
        fontFamily: 'Fraunces',
        fontWeight: 900,
        fill: '#f5f0e8',
        textAlign: 'left',
        left: 60,
        originX: 'left',
        charSpacing: -30
      });
      setSubtitleStyle({
        top: 500,
        fontSize: 18,
        fontFamily: 'Inter',
        fontWeight: 400,
        fill: '#f5f0e8',
        textAlign: 'left',
        left: 60,
        originX: 'left',
        charSpacing: 80
      });
      setAuthorStyle({
        top: 890,
        fontSize: 32,
        fontFamily: 'Inter',
        fontWeight: 800,
        fill: '#f5f0e8',
        textAlign: 'left',
        left: 60,
        originX: 'left',
        charSpacing: 120
      });
      removeOrnament();
    }
  },
  'self-help': {
    name: 'Self-Help',
    tag: 'Bold Impact',
    apply: () => {
      setTitleStyle({
        top: 300,
        maxAlto: 144,
        fontSize: 100,
        fontFamily: 'Fraunces',
        fontWeight: 900,
        fill: '#f5f0e8',
        textAlign: 'center',
        charSpacing: -20
      });
      setSubtitleStyle({
        top: 460,
        fontSize: 22,
        fontFamily: 'Inter',
        fontWeight: 600,
        fill: '#f5f0e8',
        charSpacing: 40
      });
      setAuthorStyle({
        top: 890,
        fontSize: 32,
        fontFamily: 'Inter',
        fontWeight: 800,
        fill: '#f5f0e8',
        charSpacing: 120
      });
      removeOrnament();
    }
  },
  'thriller': {
    name: 'Thriller',
    tag: 'Dark & Bold',
    apply: () => {
      setTitleStyle({
        top: 340,
        maxAlto: 144,
        fontSize: 110,
        fontFamily: 'Bebas Neue',
        fill: '#e56b5b',
        textAlign: 'center',
        charSpacing: 40
      });
      setSubtitleStyle({
        top: 500,
        fontSize: 14,
        fontFamily: 'Inter',
        fontWeight: 300,
        fill: '#f5f0e8',
        charSpacing: 400
      });
      setAuthorStyle({
        top: 890,
        fontSize: 32,
        fontFamily: 'Bebas Neue',
        fill: '#f5f0e8',
        charSpacing: 120
      });
      removeOrnament();
    }
  },
  'romance': {
    name: 'Romance',
    tag: 'Soft Elegance',
    apply: () => {
      setTitleStyle({
        top: 380,
        maxAlto: 104,
        fontSize: 86,
        fontFamily: 'Cormorant Garamond',
        fontStyle: 'italic',
        fontWeight: 500,
        fill: '#f5e9d0',
        textAlign: 'center',
        charSpacing: 30
      });
      setSubtitleStyle({
        top: 500,
        fontSize: 18,
        fontFamily: 'Cormorant Garamond',
        fontStyle: 'italic',
        fill: '#e8a5b8',
        charSpacing: 100
      });
      setAuthorStyle({
        top: 890,
        fontSize: 32,
        fontFamily: 'Inter',
        fontWeight: 400,
        fill: '#f5e9d0',
        charSpacing: 120
      });
      addOrnament('❦', 340, 24, '#e8a5b8');
    }
  },
  'poetry': {
    name: 'Poesía',
    tag: 'Whisper',
    apply: () => {
      setTitleStyle({
        top: 420,
        maxAlto: 84,
        fontSize: 62,
        fontFamily: 'Cormorant Garamond',
        fontWeight: 300,
        fill: '#f5f0e8',
        textAlign: 'center',
        charSpacing: 60
      });
      setSubtitleStyle({
        top: 520,
        fontSize: 14,
        fontFamily: 'Cormorant Garamond',
        fontStyle: 'italic',
        fill: '#f5f0e8',
        charSpacing: 200
      });
      setAuthorStyle({
        top: 890,
        fontSize: 32,
        fontFamily: 'Cormorant Garamond',
        fontStyle: 'italic',
        fill: '#a8a09a',
        charSpacing: 120
      });
      addOrnament('—', 380, 40, '#d4a744');
    }
  },
  'corporate': {
    name: 'Corporativo',
    tag: 'Business Pro',
    apply: () => {
      setTitleStyle({
        top: 100,
        maxAlto: 144,
        fontSize: 72,
        fontFamily: 'Inter',
        fontWeight: 800,
        fill: '#f5f0e8',
        textAlign: 'left',
        left: 60,
        originX: 'left',
        charSpacing: -30
      });
      setSubtitleStyle({
        top: 260,
        fontSize: 18,
        fontFamily: 'Inter',
        fontWeight: 400,
        fill: '#f5f0e8',
        textAlign: 'left',
        left: 60,
        originX: 'left',
        charSpacing: 20
      });
      setAuthorStyle({
        top: 890,
        fontSize: 32,
        fontFamily: 'Inter',
        fontWeight: 700,
        fill: '#f5f0e8',
        textAlign: 'left',
        left: 60,
        originX: 'left',
        charSpacing: 120
      });
      removeOrnament();
    }
  },
  'memoir': {
    name: 'Memoir',
    tag: 'Personal Story',
    apply: () => {
      setTitleStyle({
        top: 350,
        maxAlto: 124,
        fontSize: 81,
        fontFamily: 'Playfair Display',
        fontWeight: 400,
        fontStyle: 'italic',
        fill: '#f5f0e8',
        textAlign: 'center',
        charSpacing: 10
      });
      setSubtitleStyle({
        top: 490,
        fontSize: 15,
        fontFamily: 'Inter',
        fontWeight: 300,
        fill: '#f5f0e8',
        charSpacing: 250
      });
      setAuthorStyle({
        top: 890,
        fontSize: 32,
        fontFamily: 'Playfair Display',
        fontWeight: 400,
        fill: '#f5f0e8',
        charSpacing: 120
      });
      addOrnament('·  ·  ·', 300, 18, '#d4a744');
    }
  },
  'dark-academic': {
    name: 'Dark Academic',
    tag: 'Scholarly',
    apply: () => {
      setTitleStyle({
        top: 370,
        maxAlto: 114,
        fontSize: 73,
        fontFamily: 'Cinzel',
        fontWeight: 900,
        fill: '#f5f0e8',
        textAlign: 'center',
        charSpacing: 80
      });
      setSubtitleStyle({
        top: 500,
        fontSize: 14,
        fontFamily: 'Cormorant Garamond',
        fontStyle: 'italic',
        fill: '#f5e9d0',
        charSpacing: 150
      });
      setAuthorStyle({
        top: 890,
        fontSize: 32,
        fontFamily: 'Cinzel',
        fontWeight: 400,
        fill: '#f5f0e8',
        charSpacing: 120
      });
      addOrnament('⚜', 320, 24, '#d4a744');
    }
  },
  'children': {
    name: 'Infantil',
    tag: 'Kids Fun',
    apply: () => {
      setTitleStyle({
        top: 340,
        maxAlto: 144,
        fontSize: 88,
        fontFamily: 'Fraunces',
        fontWeight: 900,
        fill: '#f5f0e8',
        textAlign: 'center',
        charSpacing: -10
      });
      setSubtitleStyle({
        top: 500,
        fontSize: 20,
        fontFamily: 'Inter',
        fontWeight: 700,
        fill: '#f7d478',
        charSpacing: 30
      });
      setAuthorStyle({
        top: 890,
        fontSize: 32,
        fontFamily: 'Inter',
        fontWeight: 800,
        fill: '#f5f0e8',
        charSpacing: 100
      });
      addOrnament('★', 300, 40, '#f7d478');
    }
  }
};

// ================================
// FONDOS PRECONFIGURADOS
// ================================
const backgrounds = {
  'solid-gold': { type: 'gradient', colors: ['#f7d478', '#b8862c'], angle: 135, label: 'Dorado' },
  'solid-cream': { type: 'gradient', colors: ['#f5e9d0', '#d4b884'], angle: 135, label: 'Crema' },
  'solid-black': { type: 'gradient', colors: ['#1a1815', '#3a3530'], angle: 135, label: 'Noir' },
  'solid-burgundy': { type: 'gradient', colors: ['#4a1a1a', '#8b3a3a'], angle: 135, label: 'Burgundy' },
  'example-business': { type: 'image', url: 'backgrounds/business.png', label: 'Business' },
  'example-mindfulness': { type: 'image', url: 'backgrounds/mindfulness.png', label: 'Mindfulness' },
  'example-selfhelp': { type: 'image', url: 'backgrounds/selfhelp.png', label: 'Self-Help' },
  'example-memoir': { type: 'image', url: 'backgrounds/memoir.png', label: 'Memoir' }
};

// ================================
// HELPERS
// ================================
function setTitleStyle(opts) {
  const text = document.getElementById('titleInput').value;
  if (state.titleObject) canvas.remove(state.titleObject);
  // T5 (I3): sin este `return`, un titulo vacio igual creaba un Textbox de
  // 521x89 px que se tragaba los clics — subtitulo y autor ya lo tenian.
  // / T5 (I3): without this `return`, an empty title still created a
  // 521x89 px Textbox that ate clicks — subtitle and author already had it.
  if (!text) { state.titleObject = null; return; }
  const maxWidth = opts.originX === 'left' ? 480 : 520;
  // v4: el titulo puede ocupar DOS lineas antes de encogerse.
  // Antes se medía con fabric.Text, que es de una sola linea, asi que el
  // auto-fit bajaba el tamano hasta que cupiera de lado a lado: "El Despertar
  // Interior" caia de 78 a 56. Ahora se mide con un Textbox del ancho real, que
  // parte solo, y solo se encoge si pasa de MAX_LINEAS. Es lo que hacen las
  // portadas que venden: titulo grande partido en dos.
  // NO se sube el tamano por encima del de la plantilla, a proposito: crecer
  // sin tope invadiria el subtitulo, que en algunas plantillas esta a 160 px.
  // / v4: the title may use TWO lines before shrinking. It used to be measured
  // with fabric.Text (single line), so auto-fit shrank it until it fit across:
  // "El Despertar Interior" dropped from 78 to 56. Now it is measured with a
  // Textbox of the real width, which wraps on its own, and only shrinks past
  // MAX_LINEAS. The size is never raised above the template value on purpose:
  // growing unbounded would invade the subtitle, only 160 px below in some.
  const MAX_LINEAS = 2;
  let fontSize = opts.fontSize;
  // El tope de alto lo trae cada plantilla (maxAlto), calculado como la
  // distancia hasta su subtitulo menos 16 px de aire. Sin el, dos lineas a 78 pt
  // invadian el subtitulo 22 px: medido, no supuesto.
  // / The height cap comes from each template (maxAlto): the distance to its own
  // subtitle minus 16 px of air. Without it, two lines at 78 pt overlapped the
  // subtitle by 22 px. Measured, not assumed.
  const maxAlto = opts.maxAlto || 999;
  const pruebaCon = (fs) => {
    const t = new fabric.Textbox(text, {
      width: maxWidth, fontSize: fs, fontFamily: opts.fontFamily,
      fontWeight: opts.fontWeight || 400, charSpacing: opts.charSpacing || 0,
      lineHeight: 1.05
    });
    return { lineas: t.textLines.length, alto: t.height };
  };
  while (fontSize > 24) {
    const p = pruebaCon(fontSize);
    if (p.lineas <= MAX_LINEAS && p.alto <= maxAlto) break;
    fontSize -= 2;
  }
  state.titleObject = new fabric.Textbox(text, {
    width: maxWidth,
    left: opts.left !== undefined ? opts.left : 300,
    originX: opts.originX || 'center',
    top: opts.top,
    fontSize: fontSize,
    fontFamily: opts.fontFamily,
    fontWeight: opts.fontWeight || 400,
    fontStyle: opts.fontStyle || 'normal',
    fill: opts.fill,
    textAlign: opts.textAlign || 'center',
    charSpacing: opts.charSpacing || 0,
    lineHeight: 1.05,
    shadow: null,
    editable: true
  });
  // T3 (I1): el estilo elegido a mano gana sobre el auto-ajuste de la
  // plantilla — el usuario lo eligio a proposito, incluido el tamano.
  // / T3 (I1): the hand-chosen style wins over the template's auto-fit — the
  // user picked it on purpose, size included.
  if (state.titleStyle) state.titleObject.set(state.titleStyle);
  if (state.titleOverride) state.titleObject.set(state.titleOverride);
  applyShadow(state.titleObject);
  canvas.add(state.titleObject);
}

function setSubtitleStyle(opts) {
  const text = document.getElementById('subtitleInput').value;
  if (state.subtitleObject) canvas.remove(state.subtitleObject);
  // T5 (I3): dejaba la referencia vieja de un objeto ya quitado del lienzo.
  // / T5 (I3): used to leave a stale reference to an object already removed
  // from the canvas.
  if (!text) { state.subtitleObject = null; return; }
  state.subtitleObject = new fabric.Textbox(text, {
    width: opts.originX === 'left' ? 480 : 500,
    left: opts.left !== undefined ? opts.left : 300,
    originX: opts.originX || 'center',
    top: opts.top,
    fontSize: opts.fontSize,
    fontFamily: opts.fontFamily,
    fontWeight: opts.fontWeight || 400,
    fontStyle: opts.fontStyle || 'normal',
    fill: opts.fill,
    textAlign: opts.textAlign || 'center',
    charSpacing: opts.charSpacing || 0,
    lineHeight: 1.3,
    editable: true
  });
  if (state.subtitleOverride) state.subtitleObject.set(state.subtitleOverride);
  canvas.add(state.subtitleObject);
}

function setAuthorStyle(opts) {
  const text = document.getElementById('authorInput').value;
  if (state.authorObject) canvas.remove(state.authorObject);
  // T5 (I3): igual que titulo/subtitulo — sin esto quedaba la referencia
  // vieja de un objeto ya quitado del lienzo.
  // / T5 (I3): same as title/subtitle — without this a stale reference to an
  // already-removed object was left behind.
  if (!text) { state.authorObject = null; return; }
  state.authorObject = new fabric.Textbox(text.toUpperCase(), {
    width: opts.originX === 'left' ? 480 : 500,
    left: opts.left !== undefined ? opts.left : 300,
    originX: opts.originX || 'center',
    top: opts.top,
    fontSize: opts.fontSize,
    fontFamily: opts.fontFamily,
    fontWeight: opts.fontWeight || 400,
    fill: opts.fill,
    textAlign: opts.textAlign || 'center',
    charSpacing: opts.charSpacing || 0,
    editable: true
  });
  // T3 (I1): el color de autor elegido a mano tambien se revertia solo.
  // / T3 (I1): the hand-chosen author color also used to revert on its own.
  if (state.authorStyle) state.authorObject.set(state.authorStyle);
  if (state.authorOverride) state.authorObject.set(state.authorOverride);
  canvas.add(state.authorObject);
}

function addOrnament(char, top, size, color) {
  if (state.ornamentObject) canvas.remove(state.ornamentObject);
  state.ornamentObject = null;
  // T8 (M2): si el usuario lo borro con Delete, no se repinta hasta un
  // cambio de plantilla de verdad o Reset (limpiado en applyTemplate).
  // / T8 (M2): if the user deleted it with Delete, it stays hidden until a
  // genuine template switch or Reset (cleared in applyTemplate).
  if (state.ornamentOculto) return;
  state.ornamentObject = new fabric.Text(char, {
    left: 300,
    originX: 'center',
    top: top,
    fontSize: size,
    fontFamily: 'Fraunces',
    fill: color,
    selectable: true
  });
  // T8 (M2): el arrastre a mano tambien se perdia al escribir una letra.
  // / T8 (M2): the hand-dragged position was also lost on every keystroke.
  if (state.ornamentOverride) state.ornamentObject.set(state.ornamentOverride);
  canvas.add(state.ornamentObject);
}

function removeOrnament() {
  if (state.ornamentObject) {
    canvas.remove(state.ornamentObject);
    state.ornamentObject = null;
  }
}

// T2 (C2/C3): en un contexto no seguro (file://, o una IP local sin TLS,
// como al probar desde el celular) `navigator.clipboard` NO EXISTE — es
// `undefined`. Entonces `.writeText(...)` lanza un TypeError SINCRONO, antes
// de que exista ninguna promesa, y un `.catch()` colgado de esa llamada
// nunca llega a correr. Por eso el try/catch es obligatorio, no cosmetico.
// Nunca rechaza: siempre resuelve true/false para que quien llama pueda
// hacer `.then()` sin preocuparse de un catch aparte.
// / T2 (C2/C3): in an insecure context (file://, or a local IP without TLS,
// e.g. testing from a phone) `navigator.clipboard` DOES NOT EXIST — it is
// `undefined`. So `.writeText(...)` throws a SYNCHRONOUS TypeError before any
// promise exists, and a `.catch()` hung off that call never runs. That is
// why the try/catch is mandatory, not decorative. Never rejects: it always
// resolves true/false so callers can `.then()` without a separate catch.
function copiarAlPortapapeles(texto) {
  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      return Promise.resolve(false);
    }
    return navigator.clipboard.writeText(texto).then(() => true).catch(() => false);
  } catch (err) {
    return Promise.resolve(false);
  }
}

function applyShadow(obj) {
  const shadowVal = parseInt(document.getElementById('titleShadow').value);
  if (shadowVal > 0) {
    obj.set('shadow', new fabric.Shadow({
      color: 'rgba(0,0,0,0.6)',
      blur: shadowVal * 2,
      offsetX: 0,
      offsetY: shadowVal / 2
    }));
  } else {
    // T6 (I4): sin este else, bajar el slider a 0 dejaba la sombra puesta —
    // solo desaparecia si por casualidad se escribia otra letra despues.
    // / T6 (I4): without this else, dragging the slider to 0 left the shadow
    // in place — it only vanished if another letter happened to be typed.
    obj.set('shadow', null);
  }
}

// ================================
// FONDOS
// ================================
function setGradientBg(colors, angle) {
  const rad = (angle * Math.PI) / 180;
  // Centro vertical 480 = mitad de 960 (alto real del lienzo). Antes era 450,
  // mitad del lienzo viejo de 900. / Vertical center 480 = half of 960 (the
  // canvas's real height). It used to be 450, half of the old 900 canvas.
  const x1 = 300 - Math.cos(rad) * 300;
  const y1 = 480 - Math.sin(rad) * 480;
  const x2 = 300 + Math.cos(rad) * 300;
  const y2 = 480 + Math.sin(rad) * 480;

  if (state.bgObject) canvas.remove(state.bgObject);
  state.bgObject = new fabric.Rect({
    left: 0, top: 0, width: 600, height: 960,
    selectable: false, evented: false,
    fill: new fabric.Gradient({
      type: 'linear',
      coords: { x1, y1, x2, y2 },
      colorStops: [
        { offset: 0, color: colors[0] },
        { offset: 1, color: colors[1] }
      ]
    })
  });
  canvas.add(state.bgObject);
  canvas.sendToBack(state.bgObject);
  applyOverlay();
}

function setImageBg(url) {
  fabric.Image.fromURL(url, (img) => {
    const scale = Math.max(600 / img.width, 960 / img.height);
    img.set({
      left: 300,
      // 480 = mitad de 960 (alto real del lienzo). Antes era 450, mitad del
      // lienzo viejo de 900: dejaba una franja negra de 30px abajo (80px en
      // el PNG final de KDP). / 480 = half of 960 (the canvas's real height).
      // It used to be 450, half of the old 900 canvas: left a 30px black
      // band at the bottom (80px in the final KDP PNG).
      top: 480,
      originX: 'center',
      originY: 'center',
      scaleX: scale,
      scaleY: scale,
      selectable: false,
      evented: false
    });
    if (state.bgObject) canvas.remove(state.bgObject);
    state.bgObject = img;
    canvas.add(img);
    canvas.sendToBack(img);
    applyOverlay();
  }, { crossOrigin: 'anonymous' });
}

function applyOverlay() {
  if (state.overlayObject) canvas.remove(state.overlayObject);
  const opacity = parseInt(document.getElementById('overlayOpacity').value) / 100;
  if (opacity > 0) {
    state.overlayObject = new fabric.Rect({
      left: 0, top: 0, width: 600, height: 960,
      fill: `rgba(0,0,0,${opacity})`,
      selectable: false, evented: false
    });
    canvas.add(state.overlayObject);
    if (state.bgObject) {
      canvas.moveTo(state.overlayObject, canvas.getObjects().indexOf(state.bgObject) + 1);
    }
  }
  canvas.renderAll();
}

// ================================
// APLICAR TEMPLATE
// ================================
function applyTemplate(id) {
  // Cambiar de verdad de plantilla si vuelve a poner todo en su sitio; volver
  // a aplicar la MISMA plantilla (lo que pasa en cada letra que se escribe)
  // debe respetar donde el usuario haya arrastrado el titulo/subtitulo/autor.
  // / A genuine template switch resets everything to its layout; re-applying
  // the SAME template (which happens on every keystroke) must keep wherever
  // the user dragged the title/subtitle/author to.
  if (id !== state.lastAppliedTemplate) {
    state.titleOverride = null;
    state.subtitleOverride = null;
    state.authorOverride = null;
    state.ornamentOverride = null; // T8
    state.ornamentOculto = false; // T8
    state.titleStyle = null; // T3
    state.authorStyle = null; // T3
  }
  state.currentTemplate = id;
  templates[id].apply();
  applyOverlay();
  canvas.renderAll();
  sincronizarPanelConEstilo(); // T11 (M3)
  state.lastAppliedTemplate = id;
  document.querySelectorAll('.template-card').forEach(c => {
    c.classList.toggle('active', c.dataset.id === id);
  });
}

// T11 (M3): tras aplicar la plantilla, el panel debe mostrar lo que
// REALMENTE quedo en el lienzo — el auto-ajuste de setTitleStyle puede bajar
// el tamano (78 -> 62 en la plantilla por defecto), y el panel seguia
// mostrando el valor fijo del HTML. Solo se toca si el usuario no eligio un
// estilo a mano (state.titleStyle/authorStyle): si lo hizo, el panel ya
// muestra su eleccion y no hay que pisarla.
// / T11 (M3): after applying the template, the panel must show what
// ACTUALLY landed on the canvas — setTitleStyle's auto-fit can shrink the
// size (78 -> 62 in the default template), and the panel kept showing the
// HTML's fixed value. Only touched when the user has not chosen a style by
// hand (state.titleStyle/authorStyle): if they did, the panel already shows
// their pick and must not be overwritten.
function sincronizarPanelConEstilo() {
  // N1: la bandera ya no protege el bloque ENTERO del titulo — protege
  // control por control. Antes, fijar solo "Espaciado letras" ponia
  // state.titleStyle = {charSpacing:60} y eso bloqueaba tambien tamano,
  // color y fuente, que el auto-ajuste SI puede cambiar solo (el panel
  // seguia diciendo 62 con un titulo largo que el auto-fit bajo a 26).
  // / N1: the flag no longer guards the WHOLE title block — it guards each
  // control on its own. Before, fixing only "Letter spacing" set
  // state.titleStyle = {charSpacing:60} and that also blocked size, color
  // and font, which auto-fit CAN change on its own (the panel kept saying
  // 62 with a long title that auto-fit had shrunk to 26).
  const ts = state.titleStyle;
  if (state.titleObject) {
    if (!ts || ts.fontSize === undefined) {
      const sizeInput = document.getElementById('titleSize');
      sizeInput.value = Math.round(state.titleObject.fontSize);
      document.getElementById('titleSizeValue').textContent = sizeInput.value;
    }
    if (!ts || ts.charSpacing === undefined) {
      const spacingInput = document.getElementById('titleSpacing');
      spacingInput.value = state.titleObject.charSpacing || 0;
      document.getElementById('titleSpacingValue').textContent = spacingInput.value;
    }
    if (!ts || ts.fill === undefined) {
      document.getElementById('titleColor').value = state.titleObject.fill;
    }
    if (!ts || ts.fontFamily === undefined) {
      const fontSelect = document.getElementById('titleFont');
      const tieneOpcion = Array.from(fontSelect.options).some(o => o.value === state.titleObject.fontFamily);
      if (tieneOpcion) fontSelect.value = state.titleObject.fontFamily;
    }
  }
  if (state.authorObject && !state.authorStyle) {
    document.getElementById('authorColor').value = state.authorObject.fill;
  }
}

// v: guarda la posicion/tamano a mano en cuanto el usuario suelta el arrastre
// o el redimensionado, para que la proxima letra escrita no lo borre.
// / v: saves the hand-placed position/size as soon as the user releases a
// drag or resize, so the next keystroke does not erase it.
canvas.on('object:modified', (e) => {
  const obj = e.target;
  if (!obj) return;
  // T4 (I2): un Textbox cambia `width` (no `scaleX`) cuando se arrastra una
  // asa LATERAL (ml/mr) — que es justo como se achica el titulo para que
  // quepa. Sin `width` aqui, ese arrastre se perdia Y ademas el titulo
  // quedaba descentrado (el `left` guardado si se reaplicaba, pero contra
  // el ancho viejo de la plantilla).
  // / T4 (I2): a Textbox changes `width` (not `scaleX`) when a SIDE handle
  // (ml/mr) is dragged — exactly how the title gets narrowed to fit.
  // Without `width` here, that drag was lost AND the title ended up
  // off-centre (the saved `left` still got re-applied, but against the
  // template's old width).
  const snapshot = { left: obj.left, top: obj.top, width: obj.width, scaleX: obj.scaleX, scaleY: obj.scaleY, angle: obj.angle };
  if (obj === state.titleObject) state.titleOverride = snapshot;
  else if (obj === state.subtitleObject) state.subtitleOverride = snapshot;
  else if (obj === state.authorObject) state.authorOverride = snapshot;
  else if (obj === state.ornamentObject) state.ornamentOverride = snapshot; // T8 (M2)
});

// T7 (I5): los tres setXStyle leen SIEMPRE el texto del <input>, nunca del
// objeto. Si el usuario edita el titulo con doble clic sobre la portada (lo
// que el README anuncia), el campo de la derecha no se enteraba, y en
// cuanto se escribia en CUALQUIER campo el texto del lienzo volvia al valor
// viejo del input. Este listener escribe target.text en el input SIN
// disparar su evento 'input' (asignar .value no lo dispara) — si lo
// disparara, applyTemplate() recrearia el objeto a media edicion y se
// perderia el cursor. / T7 (I5): all three setXStyle ALWAYS read the text
// from the <input>, never from the object. If the user edits the title with
// a double click on the cover (which the README advertises), the field on
// the right never found out, and typing in ANY field snapped the canvas
// text back to the input's old value. This listener writes target.text into
// the input WITHOUT firing its 'input' event (assigning .value does not
// fire it) — if it did, applyTemplate() would recreate the object mid-edit
// and the live cursor would be lost.
canvas.on('text:changed', (e) => {
  const obj = e.target;
  let inputId = null;
  if (obj === state.titleObject) inputId = 'titleInput';
  else if (obj === state.subtitleObject) inputId = 'subtitleInput';
  else if (obj === state.authorObject) inputId = 'authorInput';
  if (!inputId) return;
  document.getElementById(inputId).value = obj.text;
});

// v: seleccionar el titulo/subtitulo/autor en el lienzo y darle a
// Delete/Backspace no hacia NADA — no habia ningun listener de teclado.
// Alguien que sube su propia portada (de Canva, por ejemplo) espera poder
// borrar asi el texto que sobra encima, como en cualquier editor de diseno.
// Si el objeto esta en modo de edicion de texto (cursor parpadeando dentro),
// se deja que Backspace borre letras como siempre — solo se borra el campo
// completo cuando el objeto esta SELECCIONADO por fuera (con las asas).
// / v: selecting the title/subtitle/author on the canvas and pressing
// Delete/Backspace did NOTHING — there was no keyboard listener at all.
// Someone who uploads their own cover (from Canva, say) expects to be able
// to delete the leftover text on top of it, like in any design editor. If
// the object is in inline text-edit mode (blinking cursor inside), Backspace
// still deletes letters as normal — the whole field only clears when the
// object is SELECTED from outside (with the resize handles).
document.addEventListener('keydown', (e) => {
  // T9 (M5): Escape cierra el modal de Canva sin importar donde este el foco
  // — NO lo bloquea el guard de abajo (C1), porque el usuario puede tener el
  // cursor en un campo de la derecha y aun asi querer cerrar el modal.
  // / T9 (M5): Escape closes the Canva modal no matter where focus is — NOT
  // blocked by the guard below (C1), because the user may have the cursor in
  // a right-hand field and still want to close the modal.
  if (e.key === 'Escape') {
    if (canvaModal.classList.contains('active')) canvaModal.classList.remove('active');
    return;
  }
  if (e.key !== 'Backspace' && e.key !== 'Delete') return;
  // C1: este listener esta en `document`, o sea que ve CUALQUIER Backspace,
  // incluido el que el usuario teclea dentro de un <input> para corregir una
  // letra. Sin este guard, si el titulo seguia seleccionado en el lienzo,
  // ese Backspace borraba el campo COMPLETO en vez de una letra. Tambien se
  // sale si el modal de Canva esta abierto (evita borrar el titulo por
  // detras del modal). / C1: this listener lives on `document`, so it sees
  // ANY Backspace, including one typed inside an <input> to fix a letter.
  // Without this guard, if the title was still selected on the canvas, that
  // Backspace cleared the WHOLE field instead of one letter. Also bails if
  // the Canva modal is open (avoids deleting the title behind it).
  const dst = e.target;
  if (dst && (dst.tagName === 'INPUT' || dst.tagName === 'TEXTAREA' || dst.tagName === 'SELECT' || dst.isContentEditable)) return;
  if (canvaModal.classList.contains('active')) return;
  const obj = canvas.getActiveObject();
  if (!obj || obj.isEditing) return;
  if (obj === state.ornamentObject) {
    // T8 (M2): el ornamento no tiene campo de texto que vaciar — se oculta
    // hasta un cambio de plantilla de verdad o Reset (ver addOrnament).
    // / T8 (M2): the ornament has no text field to clear — it stays hidden
    // until a genuine template switch or Reset (see addOrnament).
    e.preventDefault();
    canvas.remove(state.ornamentObject);
    state.ornamentObject = null;
    state.ornamentOculto = true;
    canvas.discardActiveObject();
    canvas.renderAll();
    return;
  }
  let inputId = null;
  if (obj === state.titleObject) inputId = 'titleInput';
  else if (obj === state.subtitleObject) inputId = 'subtitleInput';
  else if (obj === state.authorObject) inputId = 'authorInput';
  if (!inputId) return;
  e.preventDefault();
  document.getElementById(inputId).value = '';
  canvas.discardActiveObject();
  applyTemplate(state.currentTemplate);
});

// ================================
// UI INIT
// ================================
function renderBackgrounds() {
  const container = document.getElementById('backgrounds');
  container.innerHTML = '';
  Object.entries(backgrounds).forEach(([id, bg]) => {
    const div = document.createElement('div');
    div.className = 'bg-thumb ' + id + (id === state.currentBg ? ' active' : '');
    if (bg.type === 'gradient') {
      div.style.background = `linear-gradient(${bg.angle}deg, ${bg.colors.join(', ')})`;
    } else if (bg.type === 'image') {
      div.style.backgroundImage = `url('${bg.url}')`;
      div.style.backgroundSize = 'cover';
      div.style.backgroundPosition = 'center';
    }
    div.innerHTML = `<div class="label">${bg.label}</div>`;
    div.onclick = () => {
      state.currentBg = id;
      if (bg.type === 'gradient') {
        setGradientBg(bg.colors, bg.angle);
      } else if (bg.type === 'image') {
        setImageBg(bg.url);
      }
      document.querySelectorAll('.bg-thumb').forEach(t => t.classList.remove('active'));
      div.classList.add('active');
    };
    container.appendChild(div);
  });

  // Botón upload — v: <label for="uploadBg"> en vez de un div con
  // onclick + input.click(). Un <label> asociado a un <input type="file">
  // abre el selector de archivos de forma nativa; el div con .click() por
  // JS a veces no abría nada, sin ningun error en consola, y no habia forma
  // de saber por que desde fuera. / v: <label for="uploadBg"> instead of a
  // div with onclick + input.click(). A <label> tied to a file <input>
  // opens the file picker natively; the div calling .click() via JS
  // sometimes opened nothing, with no console error, and there was no way
  // to tell why from the outside.
  const upload = document.createElement('label');
  upload.setAttribute('for', 'uploadBg');
  upload.className = 'bg-thumb upload';
  upload.innerHTML = '+';
  upload.title = 'Subir imagen';
  container.appendChild(upload);
}

function renderTemplates() {
  const container = document.getElementById('templates');
  container.innerHTML = '';
  Object.entries(templates).forEach(([id, t]) => {
    const div = document.createElement('div');
    div.className = 'template-card' + (id === state.currentTemplate ? ' active' : '');
    div.dataset.id = id;
    div.innerHTML = `
      <div class="preview">
        <div style="font-family:Fraunces;font-size:11px;font-weight:700;">${t.name}</div>
      </div>
      <div class="tag">${t.tag}</div>
    `;
    div.onclick = () => applyTemplate(id);
    container.appendChild(div);
  });
}

// ================================
// EVENT LISTENERS
// ================================
document.getElementById('titleInput').addEventListener('input', () => applyTemplate(state.currentTemplate));
document.getElementById('subtitleInput').addEventListener('input', () => applyTemplate(state.currentTemplate));
document.getElementById('authorInput').addEventListener('input', () => applyTemplate(state.currentTemplate));

// T3 (I1): cada handler guarda su eleccion en state.titleStyle/authorStyle,
// ademas de pintarla al toque en el objeto vivo. Sin el state, la proxima
// letra escrita (applyTemplate → setTitleStyle) recreaba el objeto con los
// valores de la plantilla y la eleccion se perdia — el panel seguia
// mostrando lo elegido pero el lienzo volvia atras.
// / T3 (I1): each handler saves its choice into state.titleStyle/authorStyle,
// besides painting it on the live object right away. Without the state, the
// next keystroke (applyTemplate → setTitleStyle) recreated the object with
// the template's values and the choice was lost — the panel kept showing
// the pick but the canvas snapped back.
document.getElementById('titleFont').addEventListener('change', (e) => {
  if (!state.titleStyle) state.titleStyle = {};
  state.titleStyle.fontFamily = e.target.value;
  if (state.titleObject) {
    state.titleObject.set('fontFamily', e.target.value);
    canvas.renderAll();
  }
});
document.getElementById('titleColor').addEventListener('input', (e) => {
  if (!state.titleStyle) state.titleStyle = {};
  state.titleStyle.fill = e.target.value;
  if (state.titleObject) {
    state.titleObject.set('fill', e.target.value);
    canvas.renderAll();
  }
});
document.getElementById('authorColor').addEventListener('input', (e) => {
  if (!state.authorStyle) state.authorStyle = {};
  state.authorStyle.fill = e.target.value;
  if (state.authorObject) {
    state.authorObject.set('fill', e.target.value);
    canvas.renderAll();
  }
});
document.getElementById('titleSize').addEventListener('input', (e) => {
  document.getElementById('titleSizeValue').textContent = e.target.value;
  if (!state.titleStyle) state.titleStyle = {};
  state.titleStyle.fontSize = parseInt(e.target.value);
  if (state.titleObject) {
    state.titleObject.set('fontSize', parseInt(e.target.value));
    canvas.renderAll();
  }
});
document.getElementById('titleSpacing').addEventListener('input', (e) => {
  document.getElementById('titleSpacingValue').textContent = e.target.value;
  if (!state.titleStyle) state.titleStyle = {};
  state.titleStyle.charSpacing = parseInt(e.target.value);
  if (state.titleObject) {
    state.titleObject.set('charSpacing', parseInt(e.target.value));
    canvas.renderAll();
  }
});
document.getElementById('overlayOpacity').addEventListener('input', (e) => {
  document.getElementById('overlayValue').textContent = e.target.value + '%';
  applyOverlay();
});
document.getElementById('titleShadow').addEventListener('input', (e) => {
  document.getElementById('shadowValue').textContent = e.target.value;
  if (state.titleObject) {
    applyShadow(state.titleObject);
    canvas.renderAll();
  }
});

// T11 (M1): subir una imagen (por el "+" o arrastrandola) no corresponde a
// NINGUNA miniatura de fondo prefijado — antes se quedaba resaltada la
// ultima que se habia tocado (p. ej. "Dorado"), y el panel mentia.
// / T11 (M1): uploading an image (via the "+" or by dragging it) matches
// NONE of the preset thumbnails — before, the last one touched (e.g.
// "Gold") stayed highlighted, and the panel lied.
function marcarFondoPersonalizado() {
  state.currentBg = 'custom';
  document.querySelectorAll('.bg-thumb').forEach(t => t.classList.remove('active'));
}

document.getElementById('uploadBg').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    setImageBg(ev.target.result);
    marcarFondoPersonalizado();
  };
  reader.readAsDataURL(file);
});

// Drag & drop de imagen sobre canvas
document.querySelector('.canvas-area').addEventListener('dragover', (e) => e.preventDefault());
document.querySelector('.canvas-area').addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    setImageBg(ev.target.result);
    marcarFondoPersonalizado();
  };
  reader.readAsDataURL(file);
});

// Export a alta resolución: 1600×2560, la medida de Amazon para ebook / high-res export: 1600×2560, Amazon ebook size
document.getElementById('exportBtn').addEventListener('click', () => {
  const title = document.getElementById('titleInput').value.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const dataURL = canvas.toDataURL({
    format: 'png',
    quality: 1,
    multiplier: 2.667  // 600*2.667=1600 y 960*2.667=2560 / 600*2.667=1600 and 960*2.667=2560
  });
  const link = document.createElement('a');
  link.download = `portada-${title}-${Date.now()}.png`;
  link.href = dataURL;
  link.click();
});

document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('titleInput').value = 'El Despertar Interior';
  document.getElementById('subtitleInput').value = 'Un viaje hacia la claridad mental';
  document.getElementById('authorInput').value = 'Joga';
  state.titleOverride = null;
  state.subtitleOverride = null;
  state.authorOverride = null;
  state.ornamentOverride = null; // T8
  state.ornamentOculto = false; // T8
  state.titleStyle = null; // T3/T11 (M1)
  state.authorStyle = null; // T3/T11 (M1)
  // N2: Reset no tocaba estos dos sliders del bloque EFECTOS porque nadie
  // los "toca" via su propio handler — hay que ponerlos en el valor por
  // defecto de index.html (6 y 52) ANTES de applyTemplate, para que
  // applyShadow/applyOverlay (que leen el slider, no un estado) los recojan.
  // / N2: Reset never touched these two EFFECTS sliders because nothing
  // "touches" them via their own handler — they must be set back to
  // index.html's default (6 and 52) BEFORE applyTemplate, so
  // applyShadow/applyOverlay (which read the slider, not a state var) pick
  // them up.
  document.getElementById('titleShadow').value = 6;
  document.getElementById('shadowValue').textContent = '6';
  document.getElementById('overlayOpacity').value = 52;
  document.getElementById('overlayValue').textContent = '52%';
  // T11 (M1): antes Reset pintaba el degradado dorado pero dejaba resaltada
  // la miniatura de fondo elegida antes (p. ej. "Business") — el panel
  // mentia sobre cual fondo estaba puesto de verdad.
  // / T11 (M1): before, Reset painted the gold gradient but left the
  // previously-chosen thumbnail highlighted (e.g. "Business") — the panel
  // lied about which background was actually applied.
  state.currentBg = 'solid-gold';
  setGradientBg(backgrounds['solid-gold'].colors, backgrounds['solid-gold'].angle);
  document.querySelectorAll('.bg-thumb').forEach(t => t.classList.remove('active'));
  const goldThumb = document.querySelector('.bg-thumb.solid-gold');
  if (goldThumb) goldThumb.classList.add('active');
  applyTemplate('editorial-gold');
});

// Botón guía Amazon KDP
document.getElementById('kdpBtn').addEventListener('click', () => {
  window.open('./amazon-kdp-guide.html', '_blank');
});

// ================================
// PROMPTS SUGERIDOS PARA HIGGSFIELD
// ================================
const promptPresets = {
  'editorial-gold': 'Editorial premium book cover, minimalist composition, warm cream and gold tones, elegant serif typography space, subtle sacred geometry patterns, soft depth of field, high-end magazine aesthetic, ultra high resolution, 2:3 aspect ratio',
  'thriller-dark': 'Cinematic thriller book cover, dark moody atmosphere, dramatic red and black tones, mysterious silhouette in shadow, foggy background, high contrast, film noir aesthetic, tension and suspense, ultra high resolution, 2:3 aspect ratio',
  'romance-soft': 'Romance book cover, soft ethereal atmosphere, dreamy pastel tones of blush and cream, delicate floral elements, warm sunset light, romantic and intimate mood, watercolor texture, ultra high resolution, 2:3 aspect ratio',
  'poetry-abstract': 'Minimalist poetry book cover, abstract composition, muted earth tones and subtle gold accents, negative space, single meaningful element, contemplative mood, artisanal paper texture, ultra high resolution, 2:3 aspect ratio',
  'corporate-clean': 'Modern corporate business book cover, clean geometric composition, deep navy blue and gold accents, minimal geometric shapes, professional and authoritative, sharp lines, executive aesthetic, ultra high resolution, 2:3 aspect ratio',
  'memoir-vintage': 'Vintage memoir book cover, nostalgic sepia tones, old photograph aesthetic, warm brown and cream, subtle grain texture, personal and intimate mood, timeless quality, ultra high resolution, 2:3 aspect ratio',
  'dark-academic': 'Dark Academia book cover, moody library atmosphere, deep burgundy and gold, classical architecture elements, candlelight, leather and parchment textures, scholarly and mysterious, ultra high resolution, 2:3 aspect ratio',
  'children-illustration': 'Colorful children book cover illustration, playful and cheerful, bright warm colors, whimsical character or scene, hand-drawn illustration style, magical and inviting, ultra high resolution, 2:3 aspect ratio',
  'mindfulness': 'Serene mindfulness book cover, calm meditative atmosphere, soft cream and warm gold, glowing silhouette or lotus, soft depth of field, peaceful and centered mood, wellness aesthetic, ultra high resolution, 2:3 aspect ratio',
  'business-modern': 'Modern business book cover, tech-forward aesthetic, deep gradient background with electric accent color, minimal geometric elements, forward-thinking and innovative, sleek and premium, ultra high resolution, 2:3 aspect ratio',
  'self-help-bold': 'Bold self-help book cover, high-impact composition, warm gold and cream on rich dark background, dynamic energy, empowering and confident mood, magazine-quality photography, ultra high resolution, 2:3 aspect ratio',
  'fantasy-epic': 'Epic fantasy book cover, dramatic magical atmosphere, mystical purple and gold tones, ancient runes or magical elements, cinematic depth, otherworldly landscape, sense of wonder, ultra high resolution, 2:3 aspect ratio'
};

document.getElementById('promptPreset').addEventListener('change', (e) => {
  const preset = e.target.value;
  if (preset && promptPresets[preset]) {
    document.getElementById('iaPrompt').value = promptPresets[preset];
  }
});

document.getElementById('iaGenerate').addEventListener('click', () => {
  // v: renombrado de "prompt" a "promptText" — el nombre "prompt" tapaba la
  // funcion global window.prompt() de mas abajo.
  // T2 (C2): ESTE comentario antes decia que el arreglo cubria "http sin
  // TLS" — no era cierto, ese era justo el caso que seguia roto (el
  // .catch() nunca corria porque el TypeError era sincrono). Ahora se usa
  // copiarAlPortapapeles(), que atrapa ese caso con try/catch de verdad.
  // / v: renamed "prompt" to "promptText" — the name "prompt" shadowed the
  // global window.prompt() below.
  // T2 (C2): THIS comment used to claim the fix covered "http without TLS"
  // — it did not, that was exactly the case still broken (the .catch()
  // never ran because the TypeError was synchronous). Now it uses
  // copiarAlPortapapeles(), which actually catches that case with try/catch.
  const promptText = document.getElementById('iaPrompt').value.trim();
  if (!promptText) {
    showToast('⚠️ Escribe o elige un prompt primero');
    return;
  }
  copiarAlPortapapeles(promptText).then((ok) => {
    if (ok) {
      showToast('✓ Prompt copiado — pégalo en Higgsfield con Cmd+V');
      setTimeout(() => {
        window.open('https://higgsfield.ai/es/ai/image?model=gpt_image_2', '_blank', 'noopener,noreferrer');
      }, 600);
    } else {
      // Fallback: mostrar el prompt para copiar a mano
      window.prompt('Copia manualmente:', promptText);
      window.open('https://higgsfield.ai/es/ai/image?model=gpt_image_2', '_blank', 'noopener,noreferrer');
    }
  });
});

// ================================
// CANVA DEEP LINK
// ================================
// Mapa de presets → URL real de Canva
// Canva usa URLs de tipo canva.com/create/<slug> que abren su editor filtrado
const canvaLinks = {
  'book-covers': 'https://www.canva.com/create/book-covers/',
  'ebook-cover': 'https://www.canva.com/create/ebook-covers/',
  'kindle-cover': 'https://www.canva.com/create/kindle-book-covers/',
  'wattpad-cover': 'https://www.canva.com/create/wattpad-book-covers/',
  'magazine-cover': 'https://www.canva.com/create/magazine-covers/'
};

const canvaModal = document.getElementById('canvaModal');

document.getElementById('canvaBtn').addEventListener('click', () => {
  canvaModal.classList.add('active');
});
document.getElementById('modalClose').addEventListener('click', () => {
  canvaModal.classList.remove('active');
});
document.getElementById('modalCancel').addEventListener('click', () => {
  canvaModal.classList.remove('active');
});
canvaModal.addEventListener('click', (e) => {
  if (e.target === canvaModal) canvaModal.classList.remove('active');
});

document.getElementById('modalContinue').addEventListener('click', () => {
  // 1. Descargar la portada actual como PNG (alta resolución)
  const title = document.getElementById('titleInput').value.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const dataURL = canvas.toDataURL({
    format: 'png',
    quality: 1,
    multiplier: 2.667
  });
  const link = document.createElement('a');
  link.download = `joga-cover-${title}-${Date.now()}.png`;
  link.href = dataURL;
  link.click();

  // 2. Copiar el título al clipboard para pegar rápido en Canva
  const bookTitle = document.getElementById('titleInput').value;
  const bookSubtitle = document.getElementById('subtitleInput').value;
  const bookAuthor = document.getElementById('authorInput').value;
  const clipboardText = `${bookTitle}\n${bookSubtitle}\n${bookAuthor}`;

  // 3. Abrir Canva con el preset elegido en una nueva pestaña
  const preset = document.getElementById('canvaPreset').value;
  const canvaUrl = canvaLinks[preset] || canvaLinks['book-covers'];

  // T2 (C3): el `.catch(() => {})` de antes no atrapaba nada — en contexto
  // no seguro el TypeError era sincrono y abortaba el handler A MEDIA FAENA:
  // el PNG ya se habia descargado pero el setTimeout de abajo (abrir Canva,
  // cerrar modal, toast) nunca llegaba a correr. copiarAlPortapapeles() SIGUE
  // SIEMPRE al setTimeout, copie o no; si no pudo copiar, el toast lo dice.
  // / T2 (C3): the old `.catch(() => {})` caught nothing — in an insecure
  // context the TypeError was synchronous and aborted the handler HALFWAY:
  // the PNG had already downloaded but the setTimeout below (open Canva,
  // close modal, toast) never ran. copiarAlPortapapeles() ALWAYS proceeds to
  // the setTimeout, whether or not it copied; if it could not, the toast says so.
  copiarAlPortapapeles(clipboardText).then((copiado) => {
    setTimeout(() => {
      window.open(canvaUrl, '_blank', 'noopener,noreferrer');
      canvaModal.classList.remove('active');

      // Toast de confirmación — sin "Título copiado" si la copia falló
      showToast(copiado
        ? '✓ Portada descargada · Título copiado · Abriendo Canva…'
        : '✓ Portada descargada · Abriendo Canva…');
    }, 400);
  });
});

function showToast(msg) {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #00c4cc, #7d2ae8);
    color: white;
    padding: 14px 24px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    z-index: 2000;
    animation: toastIn 0.3s ease-out;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ================================
// INTEGRACIÓN JOGA BOOK (postMessage API)
// ================================
// Cuando Joga Covers se abre en un iframe dentro de Joga Book,
// se comunican por window.postMessage para pasar datos ida/vuelta
//
// Joga Book puede enviar:
//   { type: 'JOGA_COVERS_INIT', title, subtitle, author, genre }
// Joga Covers responde con:
//   { type: 'JOGA_COVERS_READY' }
//   { type: 'JOGA_COVERS_EXPORT', dataUrl, filename }

const isEmbedded = window.self !== window.top;

if (isEmbedded) {
  // Notificar a Joga Book que ya estamos listos
  window.parent.postMessage({ type: 'JOGA_COVERS_READY' }, '*');

  // Escuchar comandos de Joga Book
  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (!msg || !msg.type) return;

    if (msg.type === 'JOGA_COVERS_INIT') {
      // Cargar título/subtítulo/autor del libro
      if (msg.title) document.getElementById('titleInput').value = msg.title;
      if (msg.subtitle) document.getElementById('subtitleInput').value = msg.subtitle;
      if (msg.author) document.getElementById('authorInput').value = msg.author;

      // Auto-elegir template por género
      const genreToTemplate = {
        'self-help': 'self-help',
        'thriller': 'thriller',
        'romance': 'romance',
        'poetry': 'poetry',
        'business': 'corporate',
        'memoir': 'memoir',
        'academic': 'dark-academic',
        'children': 'children',
        'fiction': 'editorial-gold',
        'non-fiction': 'minimal-serif'
      };
      const tpl = genreToTemplate[msg.genre] || 'editorial-gold';
      applyTemplate(tpl);
    }

    if (msg.type === 'JOGA_COVERS_REQUEST_EXPORT') {
      const title = document.getElementById('titleInput').value.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const dataUrl = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2.667 });
      window.parent.postMessage({
        type: 'JOGA_COVERS_EXPORT',
        dataUrl,
        filename: `portada-${title}-${Date.now()}.png`,
        meta: {
          title: document.getElementById('titleInput').value,
          subtitle: document.getElementById('subtitleInput').value,
          author: document.getElementById('authorInput').value,
          template: state.currentTemplate
        }
      }, '*');
    }
  });

  // Añadir botón "Guardar en Joga Book" cuando estamos embebidos
  document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      const saveBtn = document.createElement('button');
      saveBtn.className = 'btn primary';
      saveBtn.textContent = 'Guardar en Joga Book'; // v2: sin emoji, para que combine con Joga Books / no emoji, to match Joga Books
      saveBtn.style.cssText = 'background: linear-gradient(135deg, #d4a744, #b8862c); margin-right: 8px;';
      saveBtn.onclick = () => {
        window.postMessage({ type: 'JOGA_COVERS_REQUEST_EXPORT' }, '*');
      };
      exportBtn.parentNode.insertBefore(saveBtn, exportBtn);
    }
  });
}

// ================================
// INIT
// ================================
document.fonts.ready.then(() => {
  renderBackgrounds();
  renderTemplates();
  setGradientBg(backgrounds['solid-gold'].colors, backgrounds['solid-gold'].angle);
  
  // Leer URL params (title, subtitle, author) si vienen de Joga Books
  const params = new URLSearchParams(window.location.search);
  if (params.get('title')) document.getElementById('titleInput').value = params.get('title');
  if (params.get('subtitle')) document.getElementById('subtitleInput').value = params.get('subtitle');
  if (params.get('author')) document.getElementById('authorInput').value = params.get('author');
  
  applyTemplate('editorial-gold');
});

// v3: el lienzo se ajusta al espacio que hay, manteniendo la proporcion.
// Antes se pintaba a tamano real (600x960) dentro de un area de 640x760 con
// overflow:hidden, asi que se cortaban 200 px por abajo. Con el lienzo anterior
// de 900 ya se cortaban 140: el fallo venia de antes, subir a 960 solo lo hizo
// mas visible. Se usa setDimensions con cssOnly para que Fabric siga sabiendo
// donde caen los clics; escalar con CSS a secas descoloca el raton.
// / v3: the canvas now fits the available space, keeping its ratio. It used to
// render at full size (600x960) inside a 640x760 area with overflow:hidden, so
// 200 px were cut off. At the old 900 height 140 px were already being cut: the
// bug predates the resize. setDimensions with cssOnly keeps Fabric aware of
// where clicks land; plain CSS scaling misaligns the mouse.
function ajustarLienzo() {
  const area = document.querySelector(".canvas-area");
  if (!area || !canvas) return;
  const caja = area.getBoundingClientRect();
  const margen = 40;
  const escala = Math.min(
    (caja.width  - margen) / canvas.getWidth(),
    (caja.height - margen) / canvas.getHeight(),
    1
  );
  if (!isFinite(escala) || escala <= 0) return;
  // Con cssOnly, Fabric 5.3 EXIGE las medidas con unidades. Sin el "px" no hace
  // nada y no avisa: medido, el estilo se quedaba en 600x960.
  // / With cssOnly, Fabric 5.3 REQUIRES units. Without "px" it silently does
  // nothing: measured, the style stayed at 600x960.
  canvas.setDimensions(
    { width: Math.round(canvas.getWidth() * escala) + "px",
      height: Math.round(canvas.getHeight() * escala) + "px" },
    { cssOnly: true }
  );
  // setDimensions deja el lienzo EN BLANCO: los objetos siguen ahi pero no se
  // pintan. Medido: el pixel del centro pasaba a transparente. Sin este
  // renderAll la portada se ve como un recuadro negro.
  // / setDimensions leaves the canvas BLANK: the objects are still there but are
  // not painted. Measured: the centre pixel went transparent. Without this
  // renderAll the cover shows as a black rectangle.
  canvas.renderAll();
}
window.addEventListener("resize", ajustarLienzo);
window.addEventListener("load", ajustarLienzo);
setTimeout(ajustarLienzo, 300);
