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

// No se puede tener dos sesiones activas a la vez: cualquier "empezar
// entrenamiento" (libre, desde rutina, o repitiendo una pasada) primero
// chequea si ya hay una en curso y, si la hay, entra a esa en vez de crear
// una nueva — sin importar qué botón se apretó para llegar acá.
async function reuseActiveOrCreate(create: () => Promise<string>) {
  const active = await getActiveWorkout();
  if (active) return active.id;
  return create();
}

export async function createWorkout() {
  return reuseActiveOrCreate(async () => {
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
  });
}

async function copyExercisesInto(
  workoutId: string,
  sourceExercises: { exercise_id: string; position: number }[],
) {
  if (sourceExercises.length === 0) return;

  const supabase = await createClient();
  const { error } = await supabase.from("workout_exercises").insert(
    sourceExercises.map((se) => ({
      workout_id: workoutId,
      exercise_id: se.exercise_id,
      position: se.position,
    })),
  );

  if (error) throw error;
}

// Arranca una sesión precargada con los ejercicios de una rutina — es lo
// que conecta "Rutinas" con la pantalla de registro que ya existe: después
// de esto, todo sigue igual que un entrenamiento libre.
export async function createWorkoutFromRoutine(routineId: string) {
  return reuseActiveOrCreate(async () => {
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

    await copyExercisesInto(workout.id, routineExercises ?? []);
    return workout.id;
  });
}

// Clona los ejercicios de una sesión pasada (haya venido de una rutina o
// libre) como punto de partida de una nueva.
export async function repeatWorkout(sourceWorkoutId: string) {
  return reuseActiveOrCreate(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data: source } = await supabase
      .from("workouts")
      .select("routine_id")
      .eq("id", sourceWorkoutId)
      .maybeSingle();

    const { data: sourceExercises } = await supabase
      .from("workout_exercises")
      .select("exercise_id, position")
      .eq("workout_id", sourceWorkoutId)
      .order("position", { ascending: true });

    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .insert({ user_id: user.id, routine_id: source?.routine_id ?? null })
      .select("id")
      .single();

    if (workoutError) throw workoutError;

    await copyExercisesInto(workout.id, sourceExercises ?? []);
    return workout.id;
  });
}

export async function getWorkoutSummary(workoutId: string) {
  const supabase = await createClient();

  const { data: workout } = await supabase
    .from("workouts")
    .select("started_at, ended_at")
    .eq("id", workoutId)
    .maybeSingle();

  const { data: workoutExercises } = await supabase
    .from("workout_exercises")
    .select("id")
    .eq("workout_id", workoutId);

  const weIds = (workoutExercises ?? []).map((we) => we.id);

  let totalSets = 0;
  let totalVolume = 0;

  if (weIds.length > 0) {
    const { data: sets } = await supabase
      .from("sets")
      .select("weight, reps")
      .in("workout_exercise_id", weIds);

    totalSets = sets?.length ?? 0;
    totalVolume = (sets ?? []).reduce(
      (sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0),
      0,
    );
  }

  const durationMinutes =
    workout?.ended_at && workout.started_at
      ? Math.round(
          (new Date(workout.ended_at).getTime() -
            new Date(workout.started_at).getTime()) /
            60000,
        )
      : null;

  return {
    exerciseCount: workoutExercises?.length ?? 0,
    totalSets,
    totalVolume,
    durationMinutes,
  };
}

// Historial con volumen, series y ejercicios por sesión. Se resuelve en
// 3 consultas en lote (no una por fila) y se agrega en memoria.
export async function listFinishedWorkoutsWithSummary() {
  const supabase = await createClient();

  const workouts = await listFinishedWorkouts();
  if (workouts.length === 0) return [];

  const workoutIds = workouts.map((w) => w.id);
  const { data: workoutExercises } = await supabase
    .from("workout_exercises")
    .select("id, workout_id")
    .in("workout_id", workoutIds);

  const weIds = (workoutExercises ?? []).map((we) => we.id);
  const { data: sets } = weIds.length
    ? await supabase
        .from("sets")
        .select("workout_exercise_id, weight, reps")
        .in("workout_exercise_id", weIds)
    : { data: [] };

  const workoutByWE = new Map(
    (workoutExercises ?? []).map((we) => [we.id, we.workout_id]),
  );

  const volume = new Map<string, number>();
  const setCount = new Map<string, number>();
  for (const s of sets ?? []) {
    const workoutId = workoutByWE.get(s.workout_exercise_id);
    if (!workoutId) continue;
    volume.set(
      workoutId,
      (volume.get(workoutId) ?? 0) + (s.weight ?? 0) * (s.reps ?? 0),
    );
    setCount.set(workoutId, (setCount.get(workoutId) ?? 0) + 1);
  }

  const exerciseCount = new Map<string, number>();
  for (const we of workoutExercises ?? []) {
    exerciseCount.set(
      we.workout_id,
      (exerciseCount.get(we.workout_id) ?? 0) + 1,
    );
  }

  return workouts.map((w) => ({
    ...w,
    volume: volume.get(w.id) ?? 0,
    setCount: setCount.get(w.id) ?? 0,
    exerciseCount: exerciseCount.get(w.id) ?? 0,
    durationMinutes: w.ended_at
      ? Math.round(
          (new Date(w.ended_at).getTime() - new Date(w.started_at).getTime()) /
            60000,
        )
      : null,
  }));
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
