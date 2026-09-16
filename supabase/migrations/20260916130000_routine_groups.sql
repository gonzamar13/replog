-- Programas: agrupan varias rutinas vigentes en un mismo período
-- ("Trimestre 1 2026" contiene "Día A", "Día B", "Día C"). Puramente
-- aditivo: routines.group_id es nullable, así que las rutinas sueltas que
-- ya existen siguen funcionando igual, sin programa asignado.

create table public.routine_groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now()
);

alter table public.routines
  add column group_id uuid references public.routine_groups (id) on delete set null;

create index routines_group_id_idx on public.routines (group_id);

alter table public.routine_groups enable row level security;

create policy "routine_groups: all own" on public.routine_groups
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
