import "server-only";

import { createClient } from "@/lib/supabase/server";

// Mejor serie histórica (por peso) de cada ejercicio que el usuario haya
// registrado. RLS limita todo esto al usuario actual, así que no hace
// falta filtrar por user_id acá.
export async function getPersonalRecords() {
  const supabase = await createClient();

  const { data: workoutExercises } = await supabase
    .from("workout_exercises")
    .select("id, exercise_id");

  if (!workoutExercises || workoutExercises.length === 0) return [];

  const weIds = workoutExercises.map((we) => we.id);
  const { data: sets } = await supabase
    .from("sets")
    .select("workout_exercise_id, weight, reps, created_at")
    .in("workout_exercise_id", weIds)
    .not("weight", "is", null);

  const exerciseByWE = new Map(
    workoutExercises.map((we) => [we.id, we.exercise_id]),
  );

  const bestByExercise = new Map<
    string,
    { weight: number; reps: number | null; date: string }
  >();

  for (const s of sets ?? []) {
    const exerciseId = exerciseByWE.get(s.workout_exercise_id);
    if (!exerciseId || s.weight == null) continue;

    const current = bestByExercise.get(exerciseId);
    if (!current || s.weight > current.weight) {
      bestByExercise.set(exerciseId, {
        weight: s.weight,
        reps: s.reps,
        date: s.created_at,
      });
    }
  }

  return Array.from(bestByExercise.entries()).map(([exerciseId, best]) => ({
    exerciseId,
    ...best,
  }));
}

// PRs logrados específicamente en una sesión: series de esa sesión que
// superan el mejor peso previo (de cualquier otra sesión) para ese
// ejercicio. Se usa en el resumen al finalizar un entrenamiento.
export async function getSessionPRs(workoutId: string) {
  const supabase = await createClient();

  const { data: sessionWorkoutExercises } = await supabase
    .from("workout_exercises")
    .select("id, exercise_id")
    .eq("workout_id", workoutId);

  if (!sessionWorkoutExercises || sessionWorkoutExercises.length === 0) {
    return [];
  }

  const sessionWEIds = sessionWorkoutExercises.map((we) => we.id);
  const { data: sessionSets } = await supabase
    .from("sets")
    .select("workout_exercise_id, weight, reps")
    .in("workout_exercise_id", sessionWEIds)
    .not("weight", "is", null);

  if (!sessionSets || sessionSets.length === 0) return [];

  const exerciseIds = [
    ...new Set(sessionWorkoutExercises.map((we) => we.exercise_id)),
  ];

  const { data: otherWorkoutExercises } = await supabase
    .from("workout_exercises")
    .select("id, exercise_id")
    .in("exercise_id", exerciseIds)
    .neq("workout_id", workoutId);

  const priorBestByExercise = new Map<string, number>();
  if (otherWorkoutExercises && otherWorkoutExercises.length > 0) {
    const otherWEIds = otherWorkoutExercises.map((we) => we.id);
    const { data: otherSets } = await supabase
      .from("sets")
      .select("workout_exercise_id, weight")
      .in("workout_exercise_id", otherWEIds)
      .not("weight", "is", null);

    const exerciseByOtherWE = new Map(
      otherWorkoutExercises.map((we) => [we.id, we.exercise_id]),
    );
    for (const s of otherSets ?? []) {
      const exerciseId = exerciseByOtherWE.get(s.workout_exercise_id);
      if (!exerciseId || s.weight == null) continue;
      const current = priorBestByExercise.get(exerciseId);
      if (!current || s.weight > current) {
        priorBestByExercise.set(exerciseId, s.weight);
      }
    }
  }

  const exerciseBySessionWE = new Map(
    sessionWorkoutExercises.map((we) => [we.id, we.exercise_id]),
  );
  const bestNewByExercise = new Map<
    string,
    { weight: number; reps: number | null }
  >();

  for (const s of sessionSets) {
    const exerciseId = exerciseBySessionWE.get(s.workout_exercise_id);
    if (!exerciseId || s.weight == null) continue;

    const priorBest = priorBestByExercise.get(exerciseId) ?? 0;
    if (s.weight > priorBest) {
      const currentBest = bestNewByExercise.get(exerciseId);
      if (!currentBest || s.weight > currentBest.weight) {
        bestNewByExercise.set(exerciseId, { weight: s.weight, reps: s.reps });
      }
    }
  }

  return Array.from(bestNewByExercise.entries()).map(([exerciseId, v]) => ({
    exerciseId,
    ...v,
  }));
}

// Evolución de un ejercicio a lo largo de las sesiones ya finalizadas:
// peso máximo y volumen total levantado por sesión.
export async function getExerciseHistory(exerciseId: string) {
  const supabase = await createClient();

  const { data: workoutExercises } = await supabase
    .from("workout_exercises")
    .select("id, workout_id")
    .eq("exercise_id", exerciseId);

  if (!workoutExercises || workoutExercises.length === 0) return [];

  const workoutIds = workoutExercises.map((we) => we.workout_id);
  const { data: workouts } = await supabase
    .from("workouts")
    .select("id, started_at")
    .in("id", workoutIds)
    .not("ended_at", "is", null)
    .order("started_at", { ascending: true });

  if (!workouts || workouts.length === 0) return [];

  const weIds = workoutExercises.map((we) => we.id);
  const { data: sets } = await supabase
    .from("sets")
    .select("workout_exercise_id, weight, reps")
    .in("workout_exercise_id", weIds);

  const workoutByWE = new Map(
    workoutExercises.map((we) => [we.id, we.workout_id]),
  );
  const setsByWorkout = new Map<
    string,
    { weight: number | null; reps: number | null }[]
  >();

  for (const s of sets ?? []) {
    const workoutId = workoutByWE.get(s.workout_exercise_id);
    if (!workoutId) continue;
    const list = setsByWorkout.get(workoutId) ?? [];
    list.push({ weight: s.weight, reps: s.reps });
    setsByWorkout.set(workoutId, list);
  }

  return workouts.map((w) => {
    const workoutSets = setsByWorkout.get(w.id) ?? [];
    const maxWeight = workoutSets.reduce(
      (max, s) => (s.weight != null && s.weight > max ? s.weight : max),
      0,
    );
    const volume = workoutSets.reduce(
      (sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0),
      0,
    );
    return {
      workoutId: w.id,
      date: w.started_at,
      maxWeight,
      volume,
      setCount: workoutSets.length,
    };
  });
}
