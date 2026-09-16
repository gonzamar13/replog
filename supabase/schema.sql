-- RepLog — esquema inicial del MVP
-- Pegar y correr en Supabase → SQL Editor (una sola vez, en un proyecto nuevo).
--
-- Nota: no creamos una tabla "users" propia — Supabase Auth ya gestiona
-- auth.users. "profiles" guarda solo los datos que la app necesita además
-- de eso, y se crea sola cuando alguien se registra (ver trigger al final
-- de esta sección).

-- ---------------------------------------------------------------------
-- 1. Perfiles
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  unit_pref text not null default 'kg' check (unit_pref in ('kg', 'lb')),
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. Ejercicios — catálogo global (owner_id null) + propios del usuario
-- ---------------------------------------------------------------------
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete cascade,
  name text not null,
  muscle_group text,
  is_custom boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Rutinas — lo planeado, nunca lo ejecutado
-- gym_id y created_by quedan reservados para la Fase 3/4 (profesores y
-- gimnasios): sin FK activa todavía, se agrega como migración aditiva
-- cuando esas tablas existan.
-- ---------------------------------------------------------------------
create table public.routines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  gym_id uuid,
  created_by uuid references public.profiles (id),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  position integer not null default 0,
  target_sets integer not null default 3,
  target_reps_min integer,
  target_reps_max integer,
  target_rest_seconds integer default 90
);

-- ---------------------------------------------------------------------
-- 4. Entrenamientos — lo ejecutado, lo real
-- ---------------------------------------------------------------------
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  routine_id uuid references public.routines (id) on delete set null,
  gym_id uuid, -- reservado para Fase 4
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text
);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  position integer not null default 0
);

create table public.sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises (id) on delete cascade,
  set_number integer not null,
  weight numeric(6, 2),
  reps integer,
  is_failure boolean not null default false,
  rest_seconds_actual integer,
  note text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. Peso corporal — una fila por registro
-- ---------------------------------------------------------------------
create table public.body_weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  logged_at date not null default current_date,
  weight numeric(5, 2) not null
);

-- ---------------------------------------------------------------------
-- Índices de acceso frecuente
-- ---------------------------------------------------------------------
create index workouts_user_id_started_at_idx on public.workouts (user_id, started_at desc);
create index sets_workout_exercise_id_idx on public.sets (workout_exercise_id);
create index routine_exercises_routine_id_idx on public.routine_exercises (routine_id);
create index body_weight_logs_user_id_idx on public.body_weight_logs (user_id, logged_at desc);

-- ---------------------------------------------------------------------
-- Row Level Security — cada usuario ve y edita solo lo suyo
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.sets enable row level security;
alter table public.body_weight_logs enable row level security;

create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

create policy "exercises: select global or own" on public.exercises
  for select using (owner_id is null or owner_id = auth.uid());
create policy "exercises: insert own" on public.exercises
  for insert with check (owner_id = auth.uid());
create policy "exercises: update own" on public.exercises
  for update using (owner_id = auth.uid());
create policy "exercises: delete own" on public.exercises
  for delete using (owner_id = auth.uid());

create policy "routines: all own" on public.routines
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "routine_exercises: all via routine" on public.routine_exercises
  for all using (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.owner_id = auth.uid()
    )
  );

create policy "workouts: all own" on public.workouts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "workout_exercises: all via workout" on public.workout_exercises
  for all using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = auth.uid()
    )
  );

create policy "sets: all via workout" on public.sets
  for all using (
    exists (
      select 1
      from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  );

create policy "body_weight_logs: all own" on public.body_weight_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
