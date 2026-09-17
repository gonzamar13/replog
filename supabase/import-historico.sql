-- RepLog — importar entrenamientos anteriores a la app
--
-- Pensado para los datos que venían del Atajo de iPhone + Google Sheets:
-- una fila por serie. Se cargan crudas en una tabla de staging y esta
-- función las convierte en workouts / workout_exercises / sets.
--
-- Correr TODO este archivo una vez en el SQL Editor de Supabase. Después,
-- ver "CÓMO SE USA" al final.
--
-- Dos cosas que resuelve y que a mano es fácil que salgan mal:
--
--   * sets.created_at se fuerza a la fecha real del entrenamiento. Es el
--     campo que la pantalla de Récords muestra como fecha del PR: con el
--     valor por defecto, todos tus récords viejos dirían "hoy".
--
--   * workouts.ended_at siempre queda seteado. Una sesión sin ended_at
--     cuenta como EN CURSO, y al tocar "Entrenar" la app te metería
--     dentro de ese entrenamiento viejo en vez de crear uno nuevo.


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
  orden      integer          -- número de fila de la planilla (opcional)
);

alter table public.import_sets enable row level security;


-- ---------------------------------------------------------------------
-- 2. La función
-- ---------------------------------------------------------------------
-- Agrupa import_sets por fecha: una sesión por día, un ejercicio por
-- nombre distinto, y las series en el orden de la columna "orden".
--
-- Si un nombre de ejercicio no existe en el catálogo, corta con un error
-- y NO deja nada a medias: cada llamada corre en su propia transacción.

create or replace function public.importar_historico(
  p_email   text,
  p_minutos integer default 60,
  p_rutina  text    default null,
  p_hora    time    default '18:00',
  p_zona    text    default 'America/Argentina/Buenos_Aires'
)
returns table (dia date, ejercicios bigint, series bigint)
language plpgsql
as $$
declare
  v_user_id    uuid;
  v_routine_id uuid;
  v_fecha      date;
  v_workout_id uuid;
  v_we_id      uuid;
  v_ex_name    text;
  v_ex_id      uuid;
  v_pos        integer;
  v_set_num    integer;
  v_started    timestamptz;
  r            record;
begin
  select id into v_user_id
    from auth.users
   where lower(email) = lower(p_email);

  if v_user_id is null then
    raise exception 'No hay ningún usuario con el email %', p_email;
  end if;

  if p_rutina is not null then
    select id into v_routine_id
      from public.routines
     where owner_id = v_user_id
       and lower(name) = lower(p_rutina)
     limit 1;

    if v_routine_id is null then
      raise exception 'No existe una rutina tuya llamada "%"', p_rutina;
    end if;
  end if;

  for v_fecha in
    select distinct s.fecha from public.import_sets s order by 1
  loop
    -- La hora importa: si se usara medianoche, el desfasaje de zona
    -- horaria movería la sesión al día anterior en el historial.
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
       where lower(e.name) = lower(v_ex_name)
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
        select s.peso, s.reps, s.rir
          from public.import_sets s
         where s.fecha = v_fecha
           and s.ejercicio = v_ex_name
         order by s.orden nulls last
      loop
        v_set_num := v_set_num + 1;

        insert into public.sets (
          workout_exercise_id, set_number, weight, reps, rir, is_failure, created_at
        ) values (
          v_we_id,
          v_set_num,
          r.peso,
          r.reps,
          r.rir,
          coalesce(r.rir = 0, false),   -- RIR 0 es al fallo
          v_started                     -- si no, el PR figuraría como de hoy
        );
      end loop;
    end loop;
  end loop;

  return query
    select s.fecha, count(distinct s.ejercicio), count(*)
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
--   Opción A (recomendada para muchas filas): Supabase → Table Editor →
--   import_sets → "Import data from CSV". El CSV tiene que tener las
--   columnas: fecha, ejercicio, peso, reps, rir, orden
--   (rir y orden pueden ir vacías).
--
--   Opción B (pocas filas, a mano):
--
--     insert into public.import_sets (fecha, ejercicio, peso, reps, rir, orden) values
--       ('2026-08-12', 'Press banca',              40,   10, null, 1),
--       ('2026-08-12', 'Press banca',              42.5,  8, 2,    2),
--       ('2026-08-12', 'Press banca',              42.5,  7, 1,    3),
--       ('2026-08-12', 'Aperturas con mancuernas', 12,   12, null, 4),
--       ('2026-08-14', 'Sentadilla',               60,   10, null, 1),
--       ('2026-08-14', 'Sentadilla',               65,    8, 2,    2);
--
--   La columna "orden" es el número de fila de la planilla. Define el
--   orden de los ejercicios y de las series dentro del día. Si va vacía,
--   el orden queda a criterio de Postgres.
--
-- PASO 2 — Revisar antes de importar (nombres que no existen en el catálogo):
--
--     select distinct i.ejercicio
--       from public.import_sets i
--      where not exists (
--            select 1 from public.exercises e
--             where lower(e.name) = lower(i.ejercicio)
--          );
--
--   Si devuelve filas, corregí esos nombres o creá los ejercicios.
--
-- PASO 3 — Importar:
--
--     select * from public.importar_historico('tu@email.com');
--
--   Parámetros opcionales:
--     p_minutos → duración asumida de cada sesión (60 por defecto)
--     p_rutina  → asociar todas las sesiones a una rutina tuya por nombre
--     p_hora    → hora del día que se le asigna (18:00 por defecto)
--
--     select * from public.importar_historico('tu@email.com', 75, 'Pecho + Tríceps');
--
--   Devuelve un resumen: día, cuántos ejercicios y cuántas series.
--
-- PASO 4 — Vaciar el staging antes del próximo lote:
--
--     truncate public.import_sets;
--
-- PASO 5 — Cuando termines de importar todo, limpiar la herramienta:
--
--     drop function if exists public.importar_historico(text, integer, text, time, text);
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
