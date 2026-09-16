-- Entrenamientos: lo ejecutado, el hecho real. Nunca reescribe routine_exercises.

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  routine_id uuid references public.routines (id) on delete set null,
  gym_id uuid, -- reservado para Fase 4, ver nota en 20260916120200_routines.sql
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

create index workouts_user_id_started_at_idx on public.workouts (user_id, started_at desc);
create index sets_workout_exercise_id_idx on public.sets (workout_exercise_id);

alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.sets enable row level security;

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
