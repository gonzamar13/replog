import "server-only";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Routine = Database["public"]["Tables"]["routines"]["Row"];
export type RoutineExercise =
  Database["public"]["Tables"]["routine_exercises"]["Row"];

export async function listRoutines() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("routines")
    .select("*")
    .order("created_at", { ascending: false });

  return data ?? [];
}

// Agrupa las rutinas del usuario por programa, para la pantalla de
// Rutinas: cada programa con sus rutinas, más una lista de las que no
// pertenecen a ninguno.
export async function listRoutinesGroupedByProgram() {
  const [routines, groups] = await Promise.all([
    listRoutines(),
    (async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from("routine_groups")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    })(),
  ]);

  const routinesByGroup = new Map<string, typeof routines>();
  const ungrouped: typeof routines = [];

  for (const routine of routines) {
    if (routine.group_id) {
      const list = routinesByGroup.get(routine.group_id) ?? [];
      list.push(routine);
      routinesByGroup.set(routine.group_id, list);
    } else {
      ungrouped.push(routine);
    }
  }

  return {
    groups: groups.map((group) => ({
      group,
      routines: routinesByGroup.get(group.id) ?? [],
    })),
    ungrouped,
  };
}

// Cuántos ejercicios tiene cada rutina y cuánto duró en promedio en la
// vida real. La duración no está guardada en ningún lado: se deriva de
// las sesiones ya finalizadas que usaron esa rutina.
export async function getRoutineStats() {
  const supabase = await createClient();

  const [{ data: routineExercises }, { data: workouts }] = await Promise.all([
    supabase.from("routine_exercises").select("routine_id"),
    supabase
      .from("workouts")
      .select("routine_id, started_at, ended_at")
      .not("routine_id", "is", null)
      .not("ended_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(120),
  ]);

  const exerciseCount = new Map<string, number>();
  for (const re of routineExercises ?? []) {
    exerciseCount.set(re.routine_id, (exerciseCount.get(re.routine_id) ?? 0) + 1);
  }

  const durations = new Map<string, number[]>();
  for (const w of workouts ?? []) {
    if (!w.routine_id || !w.ended_at) continue;
    const minutes = Math.round(
      (new Date(w.ended_at).getTime() - new Date(w.started_at).getTime()) / 60000,
    );
    if (minutes <= 0) continue;
    const list = durations.get(w.routine_id) ?? [];
    list.push(minutes);
    durations.set(w.routine_id, list);
  }

  const stats = new Map<
    string,
    { exerciseCount: number; typicalMinutes: number | null; sessions: number }
  >();

  for (const routineId of new Set([
    ...exerciseCount.keys(),
    ...durations.keys(),
  ])) {
    const list = durations.get(routineId) ?? [];
    stats.set(routineId, {
      exerciseCount: exerciseCount.get(routineId) ?? 0,
      typicalMinutes: median(list),
      sessions: list.length,
    });
  }

  return stats;
}

/**
 * Mediana, no promedio: "finalizar" es manual, así que basta olvidarse
 * de cerrar una sesión una vez para que un valor de 3 horas arruine el
 * promedio para siempre. La mediana ignora ese tipo de outlier.
 */
function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export async function getRoutine(routineId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("routines")
    .select("*")
    .eq("id", routineId)
    .maybeSingle();

  return data;
}

export async function getRoutineExercises(routineId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("routine_exercises")
    .select("*")
    .eq("routine_id", routineId)
    .order("position", { ascending: true });

  return data ?? [];
}

export async function createRoutine(name: string, groupId: string | null) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase
    .from("routines")
    .insert({ owner_id: user.id, name, group_id: groupId })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateRoutineGroup(
  routineId: string,
  groupId: string | null,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("routines")
    .update({ group_id: groupId })
    .eq("id", routineId);

  if (error) throw error;
}

export async function updateRoutineDays(routineId: string, days: number[]) {
  const supabase = await createClient();
  const clean = [...new Set(days)].filter((d) => d >= 1 && d <= 7).sort();

  const { error } = await supabase
    .from("routines")
    .update({ days: clean })
    .eq("id", routineId);

  if (error) throw error;
}

export async function renameRoutine(routineId: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("routines")
    .update({ name })
    .eq("id", routineId);

  if (error) throw error;
}

export async function moveRoutineExercise(
  routineId: string,
  routineExerciseId: string,
  direction: "up" | "down",
) {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("routine_exercises")
    .select("id, position")
    .eq("routine_id", routineId)
    .order("position", { ascending: true });

  if (!items) return;

  const index = items.findIndex((item) => item.id === routineExerciseId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= items.length) return;

  const a = items[index];
  const b = items[swapWith];

  await Promise.all([
    supabase
      .from("routine_exercises")
      .update({ position: b.position })
      .eq("id", a.id),
    supabase
      .from("routine_exercises")
      .update({ position: a.position })
      .eq("id", b.id),
  ]);
}

export async function deleteRoutine(routineId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("routines")
    .delete()
    .eq("id", routineId);

  if (error) throw error;
}

export async function addExerciseToRoutine(input: {
  routineId: string;
  exerciseId: string;
  targetSets: number;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
  targetRestSeconds: number | null;
}) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("routine_exercises")
    .select("id", { count: "exact", head: true })
    .eq("routine_id", input.routineId);

  const { error } = await supabase.from("routine_exercises").insert({
    routine_id: input.routineId,
    exercise_id: input.exerciseId,
    position: count ?? 0,
    target_sets: input.targetSets,
    target_reps_min: input.targetRepsMin,
    target_reps_max: input.targetRepsMax,
    target_rest_seconds: input.targetRestSeconds,
  });

  if (error) throw error;
}

export async function removeRoutineExercise(routineExerciseId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("routine_exercises")
    .delete()
    .eq("id", routineExerciseId);

  if (error) throw error;
}
