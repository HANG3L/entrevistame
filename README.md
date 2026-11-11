# Entrevistame

Prototipo para practicar entrevistas de trabajo por voz con IA. El usuario entra con Google, sube su CV y elige un puesto; la IA prepara la entrevista, hace las preguntas en voz alta, repregunta según las respuestas y al final da feedback.

**Stack (gratis):** Next.js 16 · Tailwind · Supabase (login con Google, base de datos, archivos) · Gemini API · Web Speech API del navegador.

## Arrancar en local

```bash
npm install
cp .env.example .env.local   # y rellena las claves
npm run dev
```

Abre http://localhost:3000 en **Chrome o Edge** (el reconocimiento de voz no funciona en Firefox).

## Configuración

1. **Gemini:** en https://aistudio.google.com crea una API key y ponla en `GEMINI_API_KEY`.
2. **Supabase:** crea un proyecto y copia la URL y la publishable key (Project Settings → API) en `.env.local`.
3. **Base de datos:** en Supabase → SQL Editor, ejecuta [`supabase/schema.sql`](supabase/schema.sql).
4. **Login con Google:**
   - En Google Cloud Console → APIs y servicios → Credenciales, crea un *ID de cliente OAuth* de tipo *Aplicación web*.
   - En *URIs de redirección autorizados* pega la *Callback URL* que muestra Supabase en Authentication → Sign In / Providers → Google.
   - Copia el Client ID y el Client Secret en ese mismo panel de Supabase y activa Google.
   - En Supabase → Authentication → URL Configuration, agrega `http://localhost:3000/**` a las Redirect URLs.

## Estructura

```
app/
  page.tsx                 Landing + "Entrar con Google"
  auth/callback, signout   Login y logout
  (privado)/               Páginas que exigen sesión
    dashboard, perfil, nueva, entrevista/[id], resultado/[id]
  api/analyze, turn, feedback   Backend de la IA
components/                Componentes de UI
lib/supabase/              Clientes de Supabase (navegador, servidor, proxy)
lib/gemini.ts              Cliente de Gemini (solo servidor)
proxy.ts                   Refresca la sesión y protege rutas
supabase/schema.sql        Tablas, seguridad (RLS) y bucket de CVs
```
