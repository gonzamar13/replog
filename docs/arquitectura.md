# Arquitectura

## Las cuatro capas

Los datos van siempre en la misma dirección. Ninguna capa se saltea.

```
supabase/migrations/     El esquema. Fuente de verdad de todo.
        ↓
lib/supabase/            Clientes de Supabase + database.types.ts
        ↓
lib/data/                Capa de datos: el ÚNICO lugar que consulta la base
        ↓
app/<ruta>/actions.ts    Server Actions: parsean el form, revalidan, redirigen
        ↓
app/<ruta>/page.tsx      Server Components que leen de lib/data y renderizan
```

**Regla dura**: una página o un componente nunca llama a Supabase directo.
Siempre pasa por `lib/data/`.

## Por qué no hay `models/`, `routers/` ni `schemas/`

Si venís de FastAPI o Django, ese layout separa cuatro cosas: la forma de los
datos, la validación de entrada, el enrutamiento HTTP y la lógica de negocio.
Acá existen las mismas cuatro, pero repartidas distinto porque el framework y
la base ya resuelven parte del trabajo.

| En FastAPI | Acá | Por qué |
|---|---|---|
| `models/` | `supabase/migrations/` + `lib/supabase/database.types.ts` | No hay clases de un ORM. La base *es* el modelo; los tipos de TS son su espejo. |
| `routers/` | las carpetas de `app/` | Next enruta por carpeta. Un `route.ts` es un endpoint puntual, no la regla. |
| `services/` | `lib/data/` | Mismo rol: ahí vive todo lo que toca la base. |
| `schemas/` | validación en las actions | Hoy alcanza con chequeos simples. Si crecen los formularios, entra Zod en `lib/validation/`. |

## Seguridad: RLS hace el trabajo pesado

Cada tabla tiene Row Level Security activa y políticas que la limitan al
dueño. Eso significa que en la capa de datos **no hay chequeos manuales de
propiedad**:

```ts
// No hace falta ningún "where user_id = ...": RLS ya lo garantiza.
export async function getWorkout(workoutId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workouts").select("*").eq("id", workoutId).maybeSingle();
  return data;
}
```

Si ese id es de otro usuario, la consulta devuelve `null` y la página hace
`notFound()`. La seguridad no depende de que nos acordemos de filtrar.

`requireUser()` en las páginas **no es la barrera de seguridad**, es
comodidad: redirige a `/login` en vez de mostrar una pantalla vacía.

## Lecturas vs escrituras

Una convención que se repite en todo `lib/data/`:

- **Lecturas** desestructuran solo `data` y caen a un valor por defecto:
  `const { data } = await ...; return data ?? []`. Si algo falla, la pantalla
  se degrada sola en vez de reventar.
- **Escrituras** desestructuran `error` y lo lanzan. Un guardado que falla
  tiene que hacer ruido, no perderse en silencio.

## Sin joins embebidos

PostgREST permite `select("*, exercises(*)")`, pero nuestros tipos están
escritos a mano y no describen esas relaciones, así que el tipado se rompe.
En su lugar se hacen **consultas separadas y se arma el resultado en
memoria** con un `Map`:

```ts
const exerciseById = new Map(exercises.map((e) => [e.id, e]));
```

Es más código pero con tipos reales. Para listas se resuelve **en lote** (tres
consultas para todo el historial), nunca una consulta por fila.

## Rendimiento

Dos cosas que importan más de lo que parece:

1. **`auth.getUser()` es una llamada de red**, no un decode local del token.
   Por eso vive envuelto en `cache()` de React dentro de `lib/auth.ts`: una
   sola por request, sin importar cuántas funciones lo pidan.
2. **Todo lo que pueda ir en paralelo va en `Promise.all`.** Un `await` suelto
   después del bloque agrega un viaje de red en serie.

Los `loading.tsx` no son decoración: sin ellos Next espera a que el servidor
termine todo antes de pintar un pixel, y el toque del usuario parece ignorado.

## Cómo agregar una funcionalidad

Ejemplo: registrar el sueño de cada noche.

1. **Migración** — `supabase/migrations/<timestamp>_sleep_logs.sql`: la tabla,
   `enable row level security` y su política. Nunca se edita una migración
   vieja; un cambio nuevo es un archivo nuevo.
2. **Tipos** — agregar la tabla a `database.types.ts` (a mano, o regenerando
   con `npx supabase gen types typescript --project-id <ref>`).
3. **Capa de datos** — `lib/data/sleep.ts` con `listSleepLogs()` y
   `createSleepLog()`.
4. **Action** — `app/sueno/actions.ts` con `"use server"`: lee el `FormData`,
   llama a la capa de datos, `revalidatePath()`.
5. **Página** — `app/sueno/page.tsx`: `await requireUser()`, leer de
   `lib/data/`, renderizar con los componentes de `components/ui`.
6. **Navegación** — sumar el acceso donde corresponda (`app-nav.tsx` si es una
   sección principal; si no, desde Perfil).

## Convenciones

- **Formularios nativos + Server Actions.** Casi todo el CRUD son `<form
  action={miAction}>` sin JavaScript de cliente. `"use client"` aparece solo
  donde hay interacción real: temporizadores, buscador, teclado numérico.
- **`SubmitButton`** en vez de `<button>` en los formularios: usa
  `useFormStatus` y muestra el estado de guardado.
- **Las acciones destructivas van detrás de un `<details>`** con confirmación.
  Nunca a un toque de distancia.
- **Los comentarios explican el porqué, no el qué.** Si hay un comentario,
  suele haber una decisión detrás.
