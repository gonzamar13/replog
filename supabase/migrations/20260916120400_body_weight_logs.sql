-- Peso corporal: una fila por registro, ni siquiera necesita ser diaria.

create table public.body_weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  logged_at date not null default current_date,
  weight numeric(5, 2) not null
);

create index body_weight_logs_user_id_idx on public.body_weight_logs (user_id, logged_at desc);

alter table public.body_weight_logs enable row level security;

create policy "body_weight_logs: all own" on public.body_weight_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
