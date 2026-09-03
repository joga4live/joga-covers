// Joga Covers — editor de portadas
// Canvas 600×900 (proporción 2:3 estándar libro) — exporta a 1600×2400 (300 DPI)

const canvas = new fabric.Canvas('canvas', {
  backgroundColor: '#1a1815',
  preserveObjectStacking: true,
  width: 600,
  height: 900
});

const state = {
  bgObject: null,
  overlayObject: null,
  titleObject: null,
  subtitleObject: null,
  authorObject: null,
  ornamentObject: null,
  currentTemplate: 'editorial-gold',
  currentBg: 'solid-gold'
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
        fontSize: 60,
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
        top: 830,
        fontSize: 16,
        fontFamily: 'Inter',
        fontWeight: 600,
        fill: '#d4a744',
        charSpacing: 300
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
        fontSize: 56,
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
        top: 820,
        fontSize: 16,
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
        top: 830,
        fontSize: 14,
        fontFamily: 'Bebas Neue',
        fill: '#d4a744',
        charSpacing: 300
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
        fontSize: 60,
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
        top: 820,
        fontSize: 14,
        fontFamily: 'Cinzel',
        fontWeight: 400,
        fill: '#f5e9d0',
        charSpacing: 400
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
        fill: '#d4a744',
        textAlign: 'left',
        left: 60,
        originX: 'left',
        charSpacing: 80
      });
      setAuthorStyle({
        top: 830,
        fontSize: 14,
        fontFamily: 'Inter',
        fontWeight: 800,
        fill: '#f5f0e8',
        textAlign: 'left',
        left: 60,
        originX: 'left',
        charSpacing: 300
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
        fontSize: 100,
        fontFamily: 'Fraunces',
        fontWeight: 900,
        fill: '#d4a744',
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
        top: 830,
        fontSize: 20,
        fontFamily: 'Inter',
        fontWeight: 800,
        fill: '#d4a744',
        charSpacing: 200
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
        top: 830,
        fontSize: 16,
        fontFamily: 'Bebas Neue',
        fill: '#f5f0e8',
        charSpacing: 350
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
        fontSize: 66,
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
        top: 830,
        fontSize: 14,
        fontFamily: 'Inter',
        fontWeight: 400,
        fill: '#f5e9d0',
        charSpacing: 400
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
        fontSize: 48,
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
        fill: '#d4a744',
        charSpacing: 200
      });
      setAuthorStyle({
        top: 830,
        fontSize: 12,
        fontFamily: 'Cormorant Garamond',
        fontStyle: 'italic',
        fill: '#a8a09a',
        charSpacing: 500
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
        fill: '#d4a744',
        textAlign: 'left',
        left: 60,
        originX: 'left',
        charSpacing: 20
      });
      setAuthorStyle({
        top: 830,
        fontSize: 14,
        fontFamily: 'Inter',
        fontWeight: 700,
        fill: '#f5f0e8',
        textAlign: 'left',
        left: 60,
        originX: 'left',
        charSpacing: 300
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
        fontSize: 62,
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
        fill: '#d4a744',
        charSpacing: 250
      });
      setAuthorStyle({
        top: 830,
        fontSize: 15,
        fontFamily: 'Playfair Display',
        fontWeight: 400,
        fill: '#f5f0e8',
        charSpacing: 250
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
        fontSize: 56,
        fontFamily: 'Cinzel',
        fontWeight: 900,
        fill: '#d4a744',
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
        top: 830,
        fontSize: 12,
        fontFamily: 'Cinzel',
        fontWeight: 400,
        fill: '#d4a744',
        charSpacing: 400
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
        top: 830,
        fontSize: 18,
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
  const maxWidth = opts.originX === 'left' ? 480 : 520;
  // Auto-fit: reducir fontSize si el título no cabe
  let fontSize = opts.fontSize;
  const testText = new fabric.Text(text, {
    fontSize, fontFamily: opts.fontFamily, fontWeight: opts.fontWeight || 400,
    charSpacing: opts.charSpacing || 0
  });
  while (testText.width > maxWidth && fontSize > 24) {
    fontSize -= 2;
    testText.set('fontSize', fontSize);
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
  applyShadow(state.titleObject);
  canvas.add(state.titleObject);
}

function setSubtitleStyle(opts) {
  const text = document.getElementById('subtitleInput').value;
  if (state.subtitleObject) canvas.remove(state.subtitleObject);
  if (!text) return;
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
  canvas.add(state.subtitleObject);
}

function setAuthorStyle(opts) {
  const text = document.getElementById('authorInput').value;
  if (state.authorObject) canvas.remove(state.authorObject);
  if (!text) return;
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
  canvas.add(state.authorObject);
}

function addOrnament(char, top, size, color) {
  if (state.ornamentObject) canvas.remove(state.ornamentObject);
  state.ornamentObject = new fabric.Text(char, {
    left: 300,
    originX: 'center',
    top: top,
    fontSize: size,
    fontFamily: 'Fraunces',
    fill: color,
    selectable: true
  });
  canvas.add(state.ornamentObject);
}

function removeOrnament() {
  if (state.ornamentObject) {
    canvas.remove(state.ornamentObject);
    state.ornamentObject = null;
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
  }
}

// ================================
// FONDOS
// ================================
function setGradientBg(colors, angle) {
  const rad = (angle * Math.PI) / 180;
  const x1 = 300 - Math.cos(rad) * 300;
  const y1 = 450 - Math.sin(rad) * 450;
  const x2 = 300 + Math.cos(rad) * 300;
  const y2 = 450 + Math.sin(rad) * 450;

  if (state.bgObject) canvas.remove(state.bgObject);
  state.bgObject = new fabric.Rect({
    left: 0, top: 0, width: 600, height: 900,
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
    const scale = Math.max(600 / img.width, 900 / img.height);
    img.set({
      left: 300,
      top: 450,
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
      left: 0, top: 0, width: 600, height: 900,
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
  state.currentTemplate = id;
  templates[id].apply();
  applyOverlay();
  canvas.renderAll();
  document.querySelectorAll('.template-card').forEach(c => {
    c.classList.toggle('active', c.dataset.id === id);
  });
}

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

  // Botón upload
  const upload = document.createElement('div');
  upload.className = 'bg-thumb upload';
  upload.innerHTML = '+';
  upload.title = 'Subir imagen';
  upload.onclick = () => document.getElementById('uploadBg').click();
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

document.getElementById('titleFont').addEventListener('change', (e) => {
  if (state.titleObject) {
    state.titleObject.set('fontFamily', e.target.value);
    canvas.renderAll();
  }
});
document.getElementById('titleColor').addEventListener('input', (e) => {
  if (state.titleObject) {
    state.titleObject.set('fill', e.target.value);
    canvas.renderAll();
  }
});
document.getElementById('authorColor').addEventListener('input', (e) => {
  if (state.authorObject) {
    state.authorObject.set('fill', e.target.value);
    canvas.renderAll();
  }
});
document.getElementById('titleSize').addEventListener('input', (e) => {
  document.getElementById('titleSizeValue').textContent = e.target.value;
  if (state.titleObject) {
    state.titleObject.set('fontSize', parseInt(e.target.value));
    canvas.renderAll();
  }
});
document.getElementById('titleSpacing').addEventListener('input', (e) => {
  document.getElementById('titleSpacingValue').textContent = e.target.value;
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

document.getElementById('uploadBg').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => setImageBg(ev.target.result);
  reader.readAsDataURL(file);
});

// Drag & drop de imagen sobre canvas
document.querySelector('.canvas-area').addEventListener('dragover', (e) => e.preventDefault());
document.querySelector('.canvas-area').addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (ev) => setImageBg(ev.target.result);
  reader.readAsDataURL(file);
});

// Export a alta resolución (1600×2400 = 300 DPI para print)
document.getElementById('exportBtn').addEventListener('click', () => {
  const title = document.getElementById('titleInput').value.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const dataURL = canvas.toDataURL({
    format: 'png',
    quality: 1,
    multiplier: 2.667  // 600 * 2.667 ≈ 1600
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
  setGradientBg(backgrounds['solid-gold'].colors, backgrounds['solid-gold'].angle);
  applyTemplate('editorial-gold');
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
  const prompt = document.getElementById('iaPrompt').value.trim();
  if (!prompt) {
    showToast('⚠️ Escribe o elige un prompt primero');
    return;
  }
  navigator.clipboard.writeText(prompt).then(() => {
    showToast('✓ Prompt copiado — pégalo en Higgsfield con Cmd+V');
    setTimeout(() => {
      window.open('https://higgsfield.ai/es/ai/image?model=gpt_image_2', '_blank', 'noopener,noreferrer');
    }, 600);
  }).catch(() => {
    // Fallback: mostrar el prompt
    prompt('Copia manualmente:', prompt);
    window.open('https://higgsfield.ai/es/ai/image?model=gpt_image_2', '_blank');
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
  navigator.clipboard.writeText(clipboardText).catch(() => {});

  // 3. Abrir Canva con el preset elegido en una nueva pestaña
  const preset = document.getElementById('canvaPreset').value;
  const canvaUrl = canvaLinks[preset] || canvaLinks['book-covers'];

  setTimeout(() => {
    window.open(canvaUrl, '_blank', 'noopener,noreferrer');
    canvaModal.classList.remove('active');

    // Toast de confirmación
    showToast('✓ Portada descargada · Título copiado · Abriendo Canva…');
  }, 400);
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
      saveBtn.textContent = '💾 Guardar en Joga Book';
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
