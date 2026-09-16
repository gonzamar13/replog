import "server-only";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase
    .from("routines")
    .insert({ owner_id: user.id, name, group_id: groupId })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
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
