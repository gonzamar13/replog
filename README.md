# RepLog

Tracker de entrenamientos mobile-first. Registrá una serie en dos toques.
Ver `docs/design-proposal.html` (o el artifact publicado) para la propuesta
completa de producto, UX y arquitectura.

Stack: Next.js 16 (App Router) + TypeScript + Tailwind CSS + Supabase
(Postgres, Auth, Row Level Security) + Vercel.

## Setup — Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, corré en orden los archivos de `supabase/migrations/`
   (el nombre ya trae el orden, del más viejo al más nuevo) y al final
   `supabase/seed.sql` (carga el catálogo de ~30 ejercicios predefinidos).
   Alternativa si instalás la [CLI de Supabase](https://supabase.com/docs/guides/local-development/cli/getting-started):
   `npx supabase link --project-ref <tu-ref>` y después `npx supabase db push`
   aplica todas las migraciones de una.
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
supabase/
  migrations/           historial de cambios al esquema, uno por archivo,
                         nunca se edita uno viejo — un cambio nuevo es
                         siempre una migración nueva.
  seed.sql               catálogo de ejercicios predefinidos
  config.toml             config de la CLI de Supabase

src/
  app/
    login/                página de login (Google + email/password)
    auth/callback/        canje del código OAuth por una sesión
    page.tsx               home, protegida — redirige a /login si no hay sesión
  lib/
    supabase/
      client.ts            cliente de Supabase para Client Components
      server.ts             cliente de Supabase para Server Components / route handlers
      database.types.ts     tipos TS generados desde el esquema — ver nota abajo
    data/
      profiles.ts            capa de datos: funciones de servidor que
                              encapsulan las queries a una tabla o dominio
                              (acá vive la lógica que en otros stacks
                              llamarías "service"). Cada pantalla nueva
                              suma su propio archivo acá.
  proxy.ts                    refresca la sesión en cada request (antes "middleware.ts")
```

### Por qué no hay carpetas `models/`, `routers/`, `schemas/`

Ese layout (FastAPI, Django, etc.) separa cuatro cosas: la forma de los
datos en la base, la validación de entrada, el enrutamiento HTTP y la
lógica de negocio. Acá existen las mismas cuatro cosas, pero repartidas
distinto porque el framework y la base ya resuelven parte del trabajo:

- **`models`** → no hay clases de un ORM. La fuente de verdad es el
  esquema de Postgres (`supabase/migrations/`) y `database.types.ts` es
  su espejo tipado en TypeScript — se regenera desde el esquema, nunca
  se edita a mano en paralelo.
- **`routers`** → Next.js no necesita un enrutador aparte: cada carpeta
  bajo `app/` ya es una ruta. Un `route.ts` (como `auth/callback/route.ts`)
  es el equivalente puntual a un endpoint, pero para leer/escribir datos
  se usan Server Components y Server Actions colocados en la misma ruta
  que los usa, no un router central.
- **`services`** → es `lib/data/`. Mismo rol que un `services/` de FastAPI:
  ahí vive la lógica que toca la base de datos, para que las páginas no
  llamen a Supabase directo.
- **`schemas`** (validación) → todavía no hace falta, porque los únicos
  formularios son de login/signup y los valida Supabase Auth. Cuando
  aparezcan formularios propios (crear rutina, registrar serie), se suma
  `lib/validation/` con esquemas de [Zod](https://zod.dev).

La regla general: cada tabla nueva es una migración nueva en
`supabase/migrations/`, y cada pantalla nueva que necesite leer o escribir
esa tabla suma su archivo correspondiente en `lib/data/`.
