# Integración de Joga Covers en Joga Book

Guía para embeber el editor de portadas `joga-covers` dentro del proyecto Next.js/React de Joga Book, usando un iframe con comunicación bidireccional vía `postMessage`.

## Arquitectura

```
┌─────────────────── Joga Book (Next.js) ──────────────────┐
│                                                          │
│   Flujo del libro:                                       │
│   ├─ 1. Escribir contenido                               │
│   ├─ 2. Humanizar con IA                                 │
│   └─ 3. Diseñar portada ←───┐                            │
│                             │                            │
│   ┌──────────── iframe ─────▼───────────────────┐        │
│   │  https://joga4live.github.io/joga-covers/  │        │
│   │  (editor completo con 13 templates)         │        │
│   │                                             │        │
│   │  ⟷ postMessage bidireccional               │        │
│   └─────────────────────────────────────────────┘        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Componente React listo para pegar

Crea `components/CoverEditor.tsx` en Joga Book:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';

interface CoverEditorProps {
  bookId: string;
  title: string;
  subtitle?: string;
  author: string;
  genre?: 'self-help' | 'thriller' | 'romance' | 'poetry' | 'business'
        | 'memoir' | 'academic' | 'children' | 'fiction' | 'non-fiction';
  onSave: (dataUrl: string, meta: {
    title: string;
    subtitle: string;
    author: string;
    template: string;
  }) => void | Promise<void>;
}

const JOGA_COVERS_URL = 'https://joga4live.github.io/joga-covers/';

export default function CoverEditor({
  bookId,
  title,
  subtitle,
  author,
  genre,
  onSave
}: CoverEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verificar origen por seguridad
      if (!event.origin.includes('joga4live.github.io')) return;

      const msg = event.data;
      if (!msg?.type) return;

      // El editor está cargado y listo
      if (msg.type === 'JOGA_COVERS_READY') {
        setReady(true);
        // Enviar datos iniciales del libro
        iframeRef.current?.contentWindow?.postMessage({
          type: 'JOGA_COVERS_INIT',
          title,
          subtitle,
          author,
          genre,
        }, '*');
      }

      // El usuario guardó la portada
      if (msg.type === 'JOGA_COVERS_EXPORT') {
        setSaving(true);
        Promise.resolve(onSave(msg.dataUrl, msg.meta))
          .finally(() => setSaving(false));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [title, subtitle, author, genre, onSave]);

  return (
    <div className="joga-cover-editor" style={{
      width: '100%',
      height: '90vh',
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid #2d2925',
      background: '#0f0e0d',
      position: 'relative',
    }}>
      {!ready && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#d4a744',
          fontFamily: 'Fraunces, serif',
          fontSize: 18,
          zIndex: 10,
          background: '#0f0e0d',
        }}>
          Cargando editor de portadas…
        </div>
      )}
      {saving && (
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: 'rgba(212, 167, 68, 0.15)',
          color: '#d4a744',
          padding: '6px 12px',
          borderRadius: 6,
          fontSize: 13,
          zIndex: 20,
        }}>
          Guardando…
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={JOGA_COVERS_URL}
        title="Joga Covers"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}
```

## Uso en una página de Joga Book

`app/books/[id]/cover/page.tsx`:

```tsx
import CoverEditor from '@/components/CoverEditor';
import { supabase } from '@/lib/supabase';

export default async function CoverPage({ params }: { params: { id: string } }) {
  // Cargar el libro desde Supabase
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', params.id)
    .single();

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontFamily: 'Fraunces', marginBottom: 20 }}>
        Diseña la portada de "{book.title}"
      </h1>

      <CoverEditor
        bookId={book.id}
        title={book.title}
        subtitle={book.subtitle}
        author={book.author_name}
        genre={book.genre}
        onSave={async (dataUrl, meta) => {
          // 1. Subir el PNG a Supabase Storage
          const base64 = dataUrl.split(',')[1];
          const blob = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
          const path = `covers/${book.id}/${Date.now()}.png`;

          const { error: uploadError } = await supabase.storage
            .from('book-covers')
            .upload(path, blob, {
              contentType: 'image/png',
              upsert: true,
            });

          if (uploadError) throw uploadError;

          // 2. Obtener URL pública
          const { data: { publicUrl } } = supabase.storage
            .from('book-covers')
            .getPublicUrl(path);

          // 3. Guardar referencia en la tabla del libro
          await supabase
            .from('books')
            .update({
              cover_url: publicUrl,
              cover_meta: meta,
            })
            .eq('id', book.id);

          // 4. Redirigir o mostrar toast
          alert('¡Portada guardada!');
        }}
      />
    </div>
  );
}
```

## Esquema recomendado en Supabase

Añade estas columnas a la tabla `books`:

```sql
alter table books
  add column cover_url text,
  add column cover_meta jsonb;

-- Bucket público para las portadas
insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true);

-- Política: cualquiera puede leer, solo el autor puede escribir
create policy "Public read book covers"
  on storage.objects for select
  using (bucket_id = 'book-covers');

create policy "Users can upload their book covers"
  on storage.objects for insert
  with check (
    bucket_id = 'book-covers'
    and auth.uid()::text = (storage.foldername(name))[2]
  );
```

## Protocolo de mensajes (postMessage)

### De Joga Book → Joga Covers

| Tipo | Payload | Efecto |
|---|---|---|
| `JOGA_COVERS_INIT` | `{ title, subtitle, author, genre }` | Precarga datos + auto-elige template por género |
| `JOGA_COVERS_REQUEST_EXPORT` | (ninguno) | Fuerza al editor a exportar y regresar el PNG |

### De Joga Covers → Joga Book

| Tipo | Payload | Cuándo se dispara |
|---|---|---|
| `JOGA_COVERS_READY` | (ninguno) | Al cargar el editor completamente |
| `JOGA_COVERS_EXPORT` | `{ dataUrl, filename, meta }` | Cuando el usuario clic en "Guardar en Joga Book" |

Todos los mensajes tienen `type: string` como discriminador. El origen se debe verificar en producción (`event.origin === 'https://joga4live.github.io'`).

## Beneficios de esta arquitectura

- **Cero código copiado**: el editor vive en un solo repo (`joga-covers`) y se actualiza para todos los libros automáticamente.
- **Ligero**: iframe no ejecuta código de Joga Book, no comparte estado — cero riesgo de conflicto.
- **Testeable**: puedes abrir `joga4live.github.io/joga-covers/` directo y probarlo sin Joga Book.
- **Migrable**: si un día quieres migrar a componente React copiado, el contrato de datos ya está definido (solo cambia el transport).

## Roadmap

- [ ] Agregar `genre` como preset auto en el iframe (ya implementado)
- [ ] Añadir tracking de eventos (`analytics.track('cover_exported', { template, genre })`)
- [ ] Soporte para múltiples versiones/historial de portadas por libro
- [ ] Sincronización de fondos IA generados en Higgsfield con `supabase.storage`
- [ ] Modo colaborativo (varias personas editando la misma portada)
