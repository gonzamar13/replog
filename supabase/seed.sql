-- RepLog — catálogo global de ejercicios predefinidos
--
-- Correr después de las migraciones. Es idempotente: si un ejercicio
-- global con ese nombre ya existe, se saltea, así que se puede volver a
-- ejecutar cada vez que se suman ejercicios nuevos al catálogo.
--
-- owner_id queda null a propósito: eso es lo que los hace visibles para
-- todos los usuarios (ver policy "exercises: select global or own").
-- Por eso solo se puede correr desde el SQL Editor de Supabase: desde la
-- app, RLS únicamente permite crear ejercicios propios.

insert into public.exercises (name, muscle_group, is_custom)
select v.name, v.muscle_group, v.is_custom
from (values
  ('Press banca', 'Pecho', false),
  ('Press banca inclinado', 'Pecho', false),
  ('Press banca con mancuernas', 'Pecho', false),
  ('Aperturas con mancuernas', 'Pecho', false),
  ('Fondos en paralelas', 'Pecho', false),
  ('Press militar', 'Hombros', false),
  ('Press militar con mancuernas', 'Hombros', false),
  ('Elevaciones laterales', 'Hombros', false),
  ('Elevaciones frontales', 'Hombros', false),
  ('Pájaros (elevaciones posteriores)', 'Hombros', false),
  ('Dominadas', 'Espalda', false),
  ('Remo con barra', 'Espalda', false),
  ('Remo con mancuerna', 'Espalda', false),
  ('Jalón al pecho', 'Espalda', false),
  ('Remo en polea baja', 'Espalda', false),
  ('Peso muerto', 'Espalda', false),
  ('Sentadilla', 'Piernas', false),
  ('Sentadilla frontal', 'Piernas', false),
  ('Prensa de piernas', 'Piernas', false),
  ('Zancadas', 'Piernas', false),
  ('Peso muerto rumano', 'Piernas', false),
  ('Extensión de cuádriceps', 'Piernas', false),
  ('Curl femoral', 'Piernas', false),
  ('Elevación de talones (gemelos)', 'Piernas', false),
  ('Curl de bíceps con barra', 'Brazos', false),
  ('Curl de bíceps con mancuernas', 'Brazos', false),
  ('Curl martillo', 'Brazos', false),
  ('Press francés', 'Brazos', false),
  ('Extensión de tríceps en polea', 'Brazos', false),
  ('Fondos de tríceps en banco', 'Brazos', false),
  ('Plancha (plank)', 'Core', false),
  ('Crunch abdominal', 'Core', false),
  ('Elevación de piernas', 'Core', false),
  ('Rueda abdominal', 'Core', false),
  ('Face pull', 'Hombros', false),
  ('Elevaciones laterales en polea', 'Hombros', false),
  ('Vuelos posteriores en Pec-Deck', 'Hombros', false),
  ('Encogimientos de hombros con mancuernas', 'Hombros', false),
  ('Press Arnold', 'Hombros', false),
  ('Remo al mentón', 'Hombros', false),
  ('Press inclinado con mancuernas', 'Pecho', false),
  ('Cruce de poleas', 'Pecho', false),
  ('Contractora de pecho (Pec-Deck)', 'Pecho', false),
  ('Remo sentado en máquina', 'Espalda', false),
  ('Remo en barra T', 'Espalda', false),
  ('Pull-over en polea', 'Espalda', false),
  ('Hiperextensiones (lumbares)', 'Espalda', false),
  ('Hip thrust (empuje de cadera)', 'Piernas', false),
  ('Sentadilla búlgara', 'Piernas', false),
  ('Peso muerto sumo', 'Piernas', false),
  ('Abductores en máquina', 'Piernas', false),
  ('Aductores en máquina', 'Piernas', false),
  ('Curl de bíceps con barra Z', 'Brazos', false),
  ('Curl predicador (banco Scott)', 'Brazos', false),
  ('Curl concentrado', 'Brazos', false),
  ('Extensión de tríceps sobre la cabeza', 'Brazos', false),
  ('Curl inverso', 'Brazos', false),
  ('Crunch en polea', 'Core', false),
  ('Rodillas al pecho', 'Core', false),
  ('Plancha lateral', 'Core', false),
  ('Crunch inverso', 'Core', false),
  ('Russian twist', 'Core', false)
) as v(name, muscle_group, is_custom)
where not exists (
  select 1
    from public.exercises e
   where lower(e.name) = lower(v.name)
     and e.owner_id is null
);
