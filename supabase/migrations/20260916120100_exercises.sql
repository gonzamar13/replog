-- Ejercicios: catálogo global (owner_id null, visible para todos) +
-- ejercicios propios de cada usuario.

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete cascade,
  name text not null,
  muscle_group text,
  is_custom boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.exercises enable row level security;

create policy "exercises: select global or own" on public.exercises
  for select using (owner_id is null or owner_id = auth.uid());

create policy "exercises: insert own" on public.exercises
  for insert with check (owner_id = auth.uid());

create policy "exercises: update own" on public.exercises
  for update using (owner_id = auth.uid());

create policy "exercises: delete own" on public.exercises
  for delete using (owner_id = auth.uid());
