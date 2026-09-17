-- RepLog — importar entrenamientos anteriores a la app
--
-- Pensado para los datos que venían del Atajo de iPhone + Google Sheets:
-- una fila por serie. Se cargan crudas en una tabla de staging y esta
-- función las convierte en workouts / workout_exercises / sets.
--
-- Correr TODO este archivo una vez en el SQL Editor de Supabase. Después,
-- ver "CÓMO SE USA" al final.
--
-- Tres cosas que resuelve y que a mano es fácil que salgan mal:
--
--   * sets.created_at se fuerza a la fecha real del entrenamiento. Es el
--     campo que la pantalla de Récords muestra como fecha del PR: con el
--     valor por defecto, todos tus récords viejos dirían "hoy".
--
--   * workouts.ended_at siempre queda seteado. Una sesión sin ended_at
--     cuenta como EN CURSO, y al tocar "Entrenar" la app te metería
--     dentro de ese entrenamiento viejo en vez de crear uno nuevo.
--
--   * La sesión se ancla a una hora del día en tu zona horaria. Con
--     medianoche, el desfasaje de zona la movería al día anterior.


-- ---------------------------------------------------------------------
-- 1. Tabla de staging
-- ---------------------------------------------------------------------
-- Acá va la planilla tal cual. RLS activa y sin políticas: desde la API
-- no la ve nadie, pero el SQL Editor (rol postgres) la usa sin problema.

create table if not exists public.import_sets (
  fecha      date not null,
  ejercicio  text not null,
  peso       numeric(6, 2),
  reps       integer,
  rir        smallint,
  orden      integer,         -- número de fila de la planilla (opcional)
  rutina     text,            -- nombre de la rutina de esa sesión (opcional)
  nota       text             -- ej. "Peso por lado" (opcional)
);

-- Por si la tabla venía de una versión anterior de este archivo
alter table public.import_sets add column if not exists rutina text;
alter table public.import_sets add column if not exists nota   text;

alter table public.import_sets enable row level security;


-- ---------------------------------------------------------------------
-- 2. Comparación sin acentos
-- ---------------------------------------------------------------------
-- "Pecho + Triceps" tiene que encontrar la rutina "Pecho + Tríceps".

create or replace function public.sin_acentos(t text)
returns text
language sql
immutable
as $$
  select translate(lower(coalesce(t, '')), 'áéíóúüñ', 'aeiouun')
$$;


-- ---------------------------------------------------------------------
-- 3. La función
-- ---------------------------------------------------------------------
-- Agrupa import_sets por fecha: una sesión por día, un ejercicio por
-- nombre distinto, y las series en el orden de la columna "orden".
--
-- Si un ejercicio no existe en el catálogo, corta con un error y NO deja
-- nada a medias: cada llamada corre en su propia transacción.
--
-- Si la rutina no existe, NO corta: avisa y deja esa sesión como
-- entrenamiento libre. Perder el vínculo con la rutina es molesto;
-- perder las series sería mucho peor.

create or replace function public.importar_historico(
  p_email   text,
  p_minutos integer default 60,
  p_rutina  text    default null,   -- se usa si la fila no trae rutina
  p_hora    time    default '18:00',
  p_zona    text    default 'America/Argentina/Buenos_Aires'
)
returns table (dia date, rutina text, ejercicios bigint, series bigint)
language plpgsql
as $$
declare
  v_user_id     uuid;
  v_fecha       date;
  v_rutina_txt  text;
  v_routine_id  uuid;
  v_workout_id  uuid;
  v_we_id       uuid;
  v_ex_name     text;
  v_ex_id       uuid;
  v_pos         integer;
  v_set_num     integer;
  v_started     timestamptz;
  r             record;
begin
  select id into v_user_id
    from auth.users
   where lower(email) = lower(p_email);

  if v_user_id is null then
    raise exception 'No hay ningún usuario con el email %', p_email;
  end if;

  for v_fecha in
    select distinct s.fecha from public.import_sets s order by 1
  loop
    -- Rutina de esa sesión: la de las filas, o el parámetro como respaldo
    select coalesce(max(s.rutina), p_rutina) into v_rutina_txt
      from public.import_sets s
     where s.fecha = v_fecha;

    v_routine_id := null;

    if v_rutina_txt is not null then
      select id into v_routine_id
        from public.routines
       where owner_id = v_user_id
         and public.sin_acentos(name) = public.sin_acentos(v_rutina_txt)
       limit 1;

      if v_routine_id is null then
        raise notice
          'No encontré una rutina tuya llamada "%" (fecha %). Esa sesión queda como entrenamiento libre.',
          v_rutina_txt, v_fecha;
      end if;
    end if;

    v_started := (v_fecha + p_hora) at time zone p_zona;

    insert into public.workouts (user_id, routine_id, started_at, ended_at)
    values (
      v_user_id,
      v_routine_id,
      v_started,
      v_started + (p_minutos || ' minutes')::interval
    )
    returning id into v_workout_id;

    v_pos := 0;

    for v_ex_name in
      select s.ejercicio
        from public.import_sets s
       where s.fecha = v_fecha
       group by s.ejercicio
       order by min(s.orden) nulls last, s.ejercicio
    loop
      select e.id into v_ex_id
        from public.exercises e
       where public.sin_acentos(e.name) = public.sin_acentos(v_ex_name)
         and (e.owner_id is null or e.owner_id = v_user_id)
       order by e.owner_id nulls first
       limit 1;

      if v_ex_id is null then
        raise exception
          'No existe el ejercicio "%" (fecha %). Creálo primero o corregí el nombre.',
          v_ex_name, v_fecha;
      end if;

      insert into public.workout_exercises (workout_id, exercise_id, position)
      values (v_workout_id, v_ex_id, v_pos)
      returning id into v_we_id;

      v_pos := v_pos + 1;
      v_set_num := 0;

      for r in
        select s.peso, s.reps, s.rir, s.nota
          from public.import_sets s
         where s.fecha = v_fecha
           and s.ejercicio = v_ex_name
         order by s.orden nulls last
      loop
        v_set_num := v_set_num + 1;

        insert into public.sets (
          workout_exercise_id, set_number, weight, reps, rir,
          is_failure, note, created_at
        ) values (
          v_we_id,
          v_set_num,
          r.peso,
          r.reps,
          r.rir,
          coalesce(r.rir = 0, false),   -- RIR 0 es al fallo
          r.nota,
          v_started                     -- si no, el PR figuraría como de hoy
        );
      end loop;
    end loop;
  end loop;

  return query
    select s.fecha,
           coalesce(max(s.rutina), p_rutina),
           count(distinct s.ejercicio),
           count(*)
      from public.import_sets s
     group by s.fecha
     order by s.fecha;
end;
$$;


-- ---------------------------------------------------------------------
-- CÓMO SE USA
-- ---------------------------------------------------------------------
--
-- PASO 1 — Cargar la planilla en import_sets.
--
--   Opción A (muchas filas): Supabase → Table Editor → import_sets →
--   "Import data from CSV", con las columnas:
--   fecha, ejercicio, peso, reps, rir, orden, rutina, nota
--
--   Opción B (a mano):
--
--     insert into public.import_sets
--       (fecha, rutina, ejercicio, peso, reps, rir, orden, nota)
--     values
--       ('2026-08-31', 'Pecho + Tríceps', 'Press banca', 30, 15, null, 1, null),
--       ('2026-08-31', 'Pecho + Tríceps', 'Press banca', 35,  7, null, 2, null);
--
--   "orden" es el número de fila de la planilla: define el orden de los
--   ejercicios y de las series dentro del día.
--
-- PASO 2 — Revisar ANTES de importar.
--
--   a) Nombres que no existen en el catálogo (tiene que dar cero filas):
--
--        select distinct i.ejercicio
--          from public.import_sets i
--         where not exists (
--               select 1 from public.exercises e
--                where public.sin_acentos(e.name) = public.sin_acentos(i.ejercicio)
--             );
--
--   b) Fechas que YA tienen un entrenamiento cargado en la app, para no
--      duplicar (por ejemplo, si estuviste probando la app esos días):
--
--        select w.started_at::date, count(*)
--          from public.workouts w
--         where w.user_id = (select id from auth.users
--                             where lower(email) = lower('tu@email.com'))
--           and w.started_at::date in (select distinct fecha from public.import_sets)
--         group by 1 order by 1;
--
-- PASO 3 — Importar:
--
--     select * from public.importar_historico('tu@email.com');
--
--   Opcionales: duración asumida por sesión, rutina de respaldo, hora:
--
--     select * from public.importar_historico('tu@email.com', 75);
--
-- PASO 4 — Vaciar el staging antes del próximo lote:
--
--     truncate public.import_sets;
--
-- PASO 5 — Al terminar de importar todo, limpiar la herramienta:
--
--     drop function if exists public.importar_historico(text, integer, text, time, text);
--     drop function if exists public.sin_acentos(text);
--     drop table if exists public.import_sets;
--
--
-- PESO CORPORAL (por si también lo tenías anotado)
--
--     insert into public.body_weight_logs (user_id, logged_at, weight)
--     select (select id from auth.users where lower(email) = lower('tu@email.com')),
--            v.fecha::date, v.peso
--       from (values
--         ('2026-08-01', 78.4),
--         ('2026-08-15', 77.9)
--       ) as v(fecha, peso);
