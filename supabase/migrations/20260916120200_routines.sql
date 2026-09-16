-- Rutinas: lo planeado, nunca lo ejecutado (eso vive en workouts/sets).
--
-- gym_id y created_by quedan como columnas reservadas para la Fase 3/4
-- (profesores y gimnasios), sin FK activa todavía — cuando esas tablas
-- existan, agregar la referencia es una migración nueva y aditiva, no
-- se toca este archivo.

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

create index routine_exercises_routine_id_idx on public.routine_exercises (routine_id);

alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;

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
