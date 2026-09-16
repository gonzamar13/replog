-- RIR (reps in reserve): cuántas repeticiones te quedaban en el tanque.
-- Nullable a propósito: cargarlo es opcional y una serie sin RIR es
-- una serie perfectamente válida.
alter table public.sets
  add column rir smallint;

alter table public.sets
  add constraint sets_rir_range
  check (rir is null or (rir >= 0 and rir <= 10));

-- RIR 0 es, por definición, al fallo. Las series viejas marcadas como
-- fallo pasan a tener RIR 0 para que el historial quede coherente.
update public.sets
  set rir = 0
  where is_failure = true and rir is null;
