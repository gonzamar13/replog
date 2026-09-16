import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Workout = Database["public"]["Tables"]["workouts"]["Row"];
export type WorkoutExercise =
  Database["public"]["Tables"]["workout_exercises"]["Row"];

export async function getActiveWorkout() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workouts")
    .select("*")
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function getWorkout(workoutId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workouts")
    .select("*")
    .eq("id", workoutId)
    .maybeSingle();

  return data;
}

export async function getWorkoutExercises(workoutId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_exercises")
    .select("*")
    .eq("workout_id", workoutId)
    .order("position", { ascending: true });

  return data ?? [];
}

export async function getSetsForWorkoutExercise(workoutExerciseId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sets")
    .select("*")
    .eq("workout_exercise_id", workoutExerciseId)
    .order("set_number", { ascending: true });

  return data ?? [];
}

export async function createWorkout() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase
    .from("workouts")
    .insert({ user_id: user.id })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function finishWorkout(workoutId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("workouts")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", workoutId);

  if (error) throw error;
}

export async function addExerciseToWorkout(
  workoutId: string,
  exerciseId: string,
) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("workout_exercises")
    .select("id", { count: "exact", head: true })
    .eq("workout_id", workoutId);

  const { error } = await supabase.from("workout_exercises").insert({
    workout_id: workoutId,
    exercise_id: exerciseId,
    position: count ?? 0,
  });

  if (error) throw error;
}
