-- Perfiles: datos propios de la app además de lo que ya guarda auth.users.
-- El trigger crea la fila sola en cuanto alguien se registra.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  unit_pref text not null default 'kg' check (unit_pref in ('kg', 'lb')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

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
