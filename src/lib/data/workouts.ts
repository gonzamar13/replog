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

// Arranca una sesión precargada con los ejercicios de una rutina — es lo
// que conecta "Rutinas" con la pantalla de registro que ya existe: después
// de esto, todo sigue igual que un entrenamiento libre.
export async function createWorkoutFromRoutine(routineId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: routineExercises, error: routineError } = await supabase
    .from("routine_exercises")
    .select("exercise_id, position")
    .eq("routine_id", routineId)
    .order("position", { ascending: true });

  if (routineError) throw routineError;

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .insert({ user_id: user.id, routine_id: routineId })
    .select("id")
    .single();

  if (workoutError) throw workoutError;

  if (routineExercises && routineExercises.length > 0) {
    const { error: exercisesError } = await supabase
      .from("workout_exercises")
      .insert(
        routineExercises.map((re) => ({
          workout_id: workout.id,
          exercise_id: re.exercise_id,
          position: re.position,
        })),
      );

    if (exercisesError) throw exercisesError;
  }

  return workout.id;
}

export async function listFinishedWorkouts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workouts")
    .select("*")
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(50);

  return data ?? [];
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
