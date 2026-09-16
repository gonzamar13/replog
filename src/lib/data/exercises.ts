import "server-only";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { WorkoutSet } from "@/lib/data/sets";

export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

export async function listExercises() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("muscle_group", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createExercise(input: {
  name: string;
  muscleGroup: string | null;
}) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase.from("exercises").insert({
    owner_id: user.id,
    name: input.name,
    muscle_group: input.muscleGroup,
    is_custom: true,
  });

  if (error) throw error;
}

// Las series de la última sesión (ya finalizada) en la que se hizo este
// ejercicio — es lo que se muestra como referencia y lo que prellena el
// peso/reps de la serie nueva. RLS ya limita todo esto al usuario actual.
export async function getLastLoggedSets(
  exerciseId: string,
  excludeWorkoutId?: string,
): Promise<WorkoutSet[] | null> {
  const supabase = await createClient();

  const { data: workoutExercises } = await supabase
    .from("workout_exercises")
    .select("id, workout_id")
    .eq("exercise_id", exerciseId);

  if (!workoutExercises || workoutExercises.length === 0) return null;

  const workoutIds = workoutExercises
    .map((we) => we.workout_id)
    .filter((id) => id !== excludeWorkoutId);

  if (workoutIds.length === 0) return null;

  const { data: workouts } = await supabase
    .from("workouts")
    .select("id, started_at")
    .in("id", workoutIds)
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(1);

  const lastWorkout = workouts?.[0];
  if (!lastWorkout) return null;

  const workoutExercise = workoutExercises.find(
    (we) => we.workout_id === lastWorkout.id,
  );
  if (!workoutExercise) return null;

  const { data: sets } = await supabase
    .from("sets")
    .select("*")
    .eq("workout_exercise_id", workoutExercise.id)
    .order("set_number", { ascending: true });

  return sets ?? null;
}
