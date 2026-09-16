# RepLog

**Track. Train. Progress.**

Tracker de entrenamientos de gimnasio, mobile-first, pensado alrededor de una
sola idea: **registrar una serie tiene que costar un toque**. Nació para
reemplazar un Atajo de iPhone que escribía en Google Sheets.

> Un tracker que no interrumpe tu entrenamiento.

---

## Qué hace hoy

| | |
|---|---|
| **Entrenar** | Sesión a pantalla completa, un ejercicio por tarjeta. Peso y reps vienen precargados con lo de la última vez: si no cambiás nada, registrar es un toque. Steppers de 0.5 kg, teclado numérico propio, RIR opcional y temporizador de descanso automático. |
| **Rutinas** | Plantillas con series, reps y descanso objetivo, agrupadas por programa (ej. "Trimestre 1") y con días de la semana asignados. |
| **Historial** | Todas las sesiones con duración, volumen y series. Se puede repetir cualquier sesión pasada. |
| **Progreso** | Evolución del peso máximo por ejercicio, volumen y 1RM estimado. |
| **Récords** | Tu mejor serie de cada ejercicio, calculada sola. |
| **Perfil** | Nombre, username, unidad (kg/lb), peso corporal y ejercicios propios. |

Instalable como PWA: al agregarla a la pantalla de inicio del iPhone abre en
pantalla completa, sin la barra de Safari.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions) + TypeScript
- **Tailwind CSS v4** — la paleta vive como tokens en `@theme`
- **Supabase** — Postgres, Auth (email + Google) y Row Level Security
- **Vercel** para el deploy

Sin ORM, sin librería de estado, sin librería de componentes, sin librería de
gráficos y sin librería de gestos. Las razones están en
[`docs/decisiones.md`](docs/decisiones.md).

---

## Puesta en marcha

### 1. Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, corré los archivos de `supabase/migrations/` **en orden**
   (el nombre ya trae el orden cronológico) y después `supabase/seed.sql`, que
   carga el catálogo de ~34 ejercicios.

   Con la [CLI de Supabase](https://supabase.com/docs/guides/local-development/cli/getting-started)
   es un solo comando:

   ```bash
   npx supabase link --project-ref <tu-ref>
   npx supabase db push
   ```

3. En **Authentication → Sign In / Providers**: email viene habilitado. Para
   Google, ver [`docs/despliegue.md`](docs/despliegue.md).
4. En **Project Settings → Data API**, copiá la `Project URL` y la clave
   `anon` / `publishable`.

### 2. Local

```bash
cp .env.example .env.local     # y completar las dos variables
npm install
npm run dev
```

Abrí <http://localhost:3000>. Te redirige a `/login`.

### 3. Deploy

Ver [`docs/despliegue.md`](docs/despliegue.md) — incluye las URLs que hay que
registrar en Supabase y en Google para que el login funcione en producción.

---

## Estructura

```
src/
  app/
    page.tsx              Inicio
    login/                Login (email + Google)
    auth/callback/        Canje del código OAuth por sesión
    workout/[id]/         Sesión en curso y modo lectura
      resumen/            Resumen al finalizar
    rutinas/              Rutinas y programas
    historial/  progreso/  records/
    perfil/  peso/  ejercicios/
    <ruta>/actions.ts     Server Actions de esa ruta
    loading.tsx           Esqueleto de carga

  components/
    ui/                   Botones, inputs, panels, gráficos
    app-nav.tsx           Tab bar (móvil) / rail lateral (escritorio)
    exercise-picker.tsx   Buscador de ejercicios
    icons.tsx             Iconos SVG propios

  lib/
    auth.ts               getCurrentUser() cacheado + requireUser()
    data/                 Capa de datos: todo el acceso a Supabase
    supabase/             Clientes y tipos de la base
  proxy.ts                Refresca la sesión en cada request

supabase/
  migrations/             Historial del esquema, uno por cambio
  seed.sql                Catálogo de ejercicios

docs/                     Documentación (abajo)
```

## Documentación

| Documento | Para qué |
|---|---|
| [`docs/arquitectura.md`](docs/arquitectura.md) | Cómo está armado y cómo se agrega una funcionalidad de punta a punta |
| [`docs/base-de-datos.md`](docs/base-de-datos.md) | Tablas, relaciones, RLS y migraciones |
| [`docs/diseno.md`](docs/diseno.md) | Sistema visual: paleta, tipografía y componentes |
| [`docs/decisiones.md`](docs/decisiones.md) | Por qué las cosas son como son |
| [`docs/despliegue.md`](docs/despliegue.md) | Vercel, Google OAuth y migraciones en producción |
| `docs/design-proposal.html` | La propuesta original de producto, UX y arquitectura |

## Comandos

```bash
npm run dev      # desarrollo
npm run build    # build de producción (corre TypeScript)
npm run lint     # ESLint
```

## Estado

Uso personal, en producción. Las funciones de profesores y gimnasios **no
están implementadas**, pero el esquema está preparado para ellas: ver la
sección correspondiente en [`docs/base-de-datos.md`](docs/base-de-datos.md).
