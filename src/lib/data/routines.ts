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

export async function createRoutine(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase
    .from("routines")
    .insert({ owner_id: user.id, name })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
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
