# RepLog

Tracker de entrenamientos mobile-first. Registrá una serie en dos toques.
Ver `docs/design-proposal.html` (o el artifact publicado) para la propuesta
completa de producto, UX y arquitectura.

Stack: Next.js 16 (App Router) + TypeScript + Tailwind CSS + Supabase
(Postgres, Auth, Row Level Security) + Vercel.

## Setup — Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, corré en orden:
   - `supabase/schema.sql` — crea las tablas del MVP y las políticas de RLS.
   - `supabase/seed.sql` — carga el catálogo de ~30 ejercicios predefinidos.
3. En **Authentication → Sign In / Providers**:
   - Email ya viene habilitado.
   - Google: activalo y cargá el Client ID / Client Secret de un proyecto de
     [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
     (tipo "OAuth client ID" → "Web application"). El *Authorized redirect URI*
     que pide Google es el que te muestra Supabase en esa misma pantalla
     (termina en `/auth/v1/callback`).
4. En **Project Settings → API**, copiá `Project URL` y `anon public` key.

## Setup local

```bash
cp .env.example .env.local
# completar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY

npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) — redirige a `/login`.
Con Google o con email/contraseña, el login te trae de vuelta a `/` ya
autenticado.

## Deploy en Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → importar este
   repo de GitHub.
2. En **Environment Variables**, cargar las mismas dos claves del
   `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. Deploy. Cada push a `main` vuelve a desplegar automáticamente.
4. En Supabase → Authentication → URL Configuration, agregar la URL de
   Vercel (`https://tu-proyecto.vercel.app`) a *Site URL* y a
   *Redirect URLs* (`https://tu-proyecto.vercel.app/auth/callback`) — si no,
   el login con Google en producción redirige mal.

## Estructura

```
src/
  app/
    login/          página de login (Google + email/password)
    auth/callback/   canje del código OAuth por una sesión
    page.tsx         home, protegida — redirige a /login si no hay sesión
  lib/supabase/
    client.ts        cliente de Supabase para Client Components
    server.ts         cliente de Supabase para Server Components / route handlers
  proxy.ts             refresca la sesión en cada request (antes "middleware.ts")
supabase/
  schema.sql           tablas del MVP + Row Level Security
  seed.sql              catálogo de ejercicios predefinidos
```
