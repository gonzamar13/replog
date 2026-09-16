-- Días de la semana en los que toca cada rutina.
-- Numeración ISO-8601: 1 = lunes … 7 = domingo. Array en la propia
-- tabla en vez de tabla puente: una rutina tiene pocos días y siempre
-- se leen junto con ella.
alter table public.routines
  add column days smallint[] not null default '{}';

-- Username del perfil. Nullable: nadie está obligado a tener uno.
alter table public.profiles
  add column username text;

alter table public.profiles
  add constraint profiles_username_format
  check (username is null or username ~ '^[a-z0-9_]{3,20}$');

-- Único sin distinguir mayúsculas. Los NULL no cuentan como duplicados,
-- así que varios perfiles pueden quedarse sin username.
create unique index profiles_username_lower_key
  on public.profiles (lower(username));
