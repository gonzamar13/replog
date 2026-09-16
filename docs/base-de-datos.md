# Base de datos

Postgres en Supabase. Todas las tablas viven en el esquema `public`, tienen
Row Level Security activa y `id` es un `uuid` con `gen_random_uuid()`.

## Mapa

```
auth.users (lo maneja Supabase Auth)
     │ 1:1
  profiles
     ├──< routine_groups ──< routines ──< routine_exercises >── exercises
     ├──< routines                                                  │
     ├──< workouts ──< workout_exercises ──< sets                   │
     │                        └───────────────────────────────>─────┘
     ├──< body_weight_logs
     └──< exercises (los propios; los globales tienen owner_id null)
```

La separación más importante del modelo:

> **`routine_exercises` es lo planeado. `sets` es lo que pasó.**

Una rutina describe una intención ("4 × 8–10 de press banca"); un set describe
un hecho ("45 × 10, así fue"). Si estuvieran en la misma tabla, ajustar el
peso en vivo reescribiría la plantilla de la rutina.

## Tablas

### `profiles`
Datos de la app que Supabase Auth no guarda. Se crea sola por trigger
(`handle_new_user`) cuando alguien se registra.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | → `auth.users(id)`, on delete cascade |
| `display_name` | text | Del `full_name` de Google si existe |
| `username` | text | Único sin distinguir mayúsculas, formato `^[a-z0-9_]{3,20}$` |
| `unit_pref` | text | `kg` \| `lb`, por defecto `kg` |

### `exercises`
Catálogo global + ejercicios propios.

| Columna | Tipo | Notas |
|---|---|---|
| `owner_id` | uuid null | **`null` = global, visible para todos** |
| `name` | text | |
| `muscle_group` | text | Agrupa en los buscadores |
| `is_custom` | boolean | |

### `routine_groups` — programas
Agrupan las rutinas vigentes en un período ("Trimestre 1 2026").

| Columna | Tipo | Notas |
|---|---|---|
| `owner_id` | uuid | |
| `name` | text | |
| `starts_on` / `ends_on` | date null | Definen cuál es el programa vigente hoy |

### `routines` — plantillas

| Columna | Tipo | Notas |
|---|---|---|
| `owner_id` | uuid | |
| `group_id` | uuid null | → `routine_groups`, on delete set null |
| `days` | smallint[] | ISO-8601: **1 = lunes … 7 = domingo** |
| `name` | text | |
| `gym_id`, `created_by` | uuid null | Reservados, ver *Futuro* abajo |

### `routine_exercises` — el objetivo

| Columna | Tipo | Notas |
|---|---|---|
| `routine_id`, `exercise_id` | uuid | |
| `position` | integer | Orden dentro de la rutina |
| `target_sets` | integer | Por defecto 3 |
| `target_reps_min` / `_max` | integer null | |
| `target_rest_seconds` | integer null | Alimenta el temporizador de descanso |

### `workouts` — la sesión real

| Columna | Tipo | Notas |
|---|---|---|
| `user_id` | uuid | |
| `routine_id` | uuid null | **Null = entrenamiento libre** |
| `started_at` / `ended_at` | timestamptz | `ended_at` null = **en curso** |
| `notes` | text null | |

La duración no se guarda: siempre es `ended_at − started_at`.

### `workout_exercises`
Qué ejercicios se hicieron efectivamente en esa sesión.

### `sets` — el hecho

| Columna | Tipo | Notas |
|---|---|---|
| `workout_exercise_id` | uuid | on delete cascade |
| `set_number` | integer | |
| `weight` | numeric(6,2) | |
| `reps` | integer | |
| `rir` | smallint null | Reps in reserve, 0–10. **Opcional** |
| `is_failure` | boolean | Se mantiene en sincronía: `rir = 0` ⇒ `true` |
| `note` | text null | |

### `body_weight_logs`
Una fila por registro: `logged_at` (date) y `weight`. No tiene que ser diaria.

## Row Level Security

Todas las tablas tienen RLS activa. El patrón:

| Tabla | Política |
|---|---|
| `profiles` | Ve y edita solo el propio |
| `exercises` | Ve los globales (`owner_id is null`) **y** los propios; solo escribe los propios |
| `routines`, `routine_groups`, `workouts`, `body_weight_logs` | Todo, solo del dueño |
| `routine_exercises` | A través de su rutina |
| `workout_exercises` | A través de su workout |
| `sets` | A través de `workout_exercises → workouts` |

Las tres últimas usan un `exists (...)` que sube por la cadena hasta
`auth.uid()`. Por eso la capa de datos no filtra por usuario a mano.

## Qué se calcula y no se guarda

Nada de esto vive en la base; todo sale de consultar `sets`:

- **Récords personales** — mejor serie por peso de cada ejercicio. Si se
  corrige un dato viejo, el récord se corrige solo.
- **Volumen** — suma de `peso × reps`.
- **Duración de la sesión** — `ended_at − started_at`.
- **Duración típica de una rutina** — **mediana** de sus sesiones pasadas
  (no promedio, ver [`decisiones.md`](decisiones.md)).
- **1RM estimado** — fórmula de Epley sobre la mejor serie.

## Migraciones

Un archivo por cambio, en orden cronológico. **Nunca se edita una migración
ya aplicada**: un cambio nuevo es un archivo nuevo.

| Archivo | Qué trae |
|---|---|
| `20260916120000_profiles.sql` | `profiles` + trigger de alta |
| `20260916120100_exercises.sql` | `exercises` |
| `20260916120200_routines.sql` | `routines`, `routine_exercises` |
| `20260916120300_workouts.sql` | `workouts`, `workout_exercises`, `sets` |
| `20260916120400_body_weight_logs.sql` | `body_weight_logs` |
| `20260916130000_routine_groups.sql` | `routine_groups` + `routines.group_id` |
| `20260916140000_routine_days_and_username.sql` | `routines.days`, `profiles.username` |
| `20260916150000_set_rir.sql` | `sets.rir` |

Aplicarlas: pegarlas en orden en el **SQL Editor** de Supabase, o
`npx supabase db push` con la CLI linkeada.

> Vercel **no** corre migraciones. Los `.sql` viajan al repo, pero aplicarlas
> es un paso manual contra Supabase.

## Preparado para el futuro (sin implementar)

El plan original contemplaba profesores y gimnasios. No están construidos,
pero el esquema no los bloquea:

- `routines.gym_id` y `workouts.gym_id` ya existen como columnas nullable, sin
  FK todavía.
- `routines.created_by` está reservada para "qué profesor armó esta rutina".

Cuando toque, es una migración **aditiva**: crear `gyms`, `gym_memberships`
(con `role`: alumno / profesor / dueño) y `routine_assignments`, y activar las
FK. No hay que reconstruir nada.

Dos invariantes que el modelo ya respeta:

- **Un usuario no depende de ningún gimnasio.** Sus `workouts` son suyos; si
  se va de un gimnasio, no se le borra nada.
- **Un usuario puede tener roles distintos en gimnasios distintos**, porque el
  rol vivirá en `gym_memberships` y no en `profiles`.
