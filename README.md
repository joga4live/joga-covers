# Joga Covers

Editor visual de portadas de libro — parte del ecosistema **Joga Book**.

**Demo en vivo:** https://joga4live.github.io/joga-covers/

## Características

- **13 templates profesionales** por género literario (Editorial, Thriller, Romance, Self-Help, Poesía, Corporativo, Memoir, Dark Academic, Infantil, Minimalista, Monolito, Clásico, Moderno)
- **6 fuentes premium** de Google Fonts (Fraunces, Playfair Display, Cormorant Garamond, Inter, Bebas Neue, Cinzel)
- **Fondos**: 4 gradientes prediseñados + upload de imagen custom + drag & drop
- **Generación con IA**: 12 prompts sugeridos por género → apertura directa a Higgsfield
- **Integración Canva**: Deep link a templates de portada con 5 formatos (Kindle, eBook, Wattpad, Revista, genérico)
- **Export a 300 DPI** (1600×2560 px, calidad print profesional)
- **Editor visual en tiempo real** (Fabric.js) — arrastra, redimensiona, edita texto directamente

## Uso local

```bash
npx serve -l 8955 .
open http://localhost:8955
```

## Estructura

```
joga-covers/
├── index.html          # UI del editor
├── app.js              # Lógica del canvas y flujos
├── backgrounds/        # (futuro) fondos IA pre-generados
└── exports/            # (futuro) portadas guardadas
```

## Flujo típico

```
1. Elige género → auto-sugerencia de template + prompt IA
2. Genera arte de fondo en Higgsfield (opcional)
3. Arrastra la imagen al canvas
4. Ajusta título, subtítulo, autor
5. Descarga PNG 300 DPI  ←  o  →  Continúa en Canva para editar avanzado
```

## Roadmap

- [ ] Integración directa con backend de Joga Book (Supabase)
- [ ] Guardar historial de portadas por libro
- [ ] Auto-generación de arte con OpenAI API (sin salir a Higgsfield)
- [ ] Presets de dimensiones: KDP paperback, IngramSpark hardcover, Wattpad
- [ ] Marca de agua editable / logo Joga Book

## Licencia

MIT — parte del ecosistema Joga Intelligence.
