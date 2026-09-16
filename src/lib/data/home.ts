import "server-only";

import { createClient } from "@/lib/supabase/server";

// Resumen para la home: todo se deriva de datos que ya existen
// (workouts, workout_exercises, sets). No guarda nada nuevo.
export async function getHomeSummary() {
  const supabase = await createClient();

  const [{ data: finished }, { count: totalWorkouts }] = await Promise.all([
    supabase
      .from("workouts")
      .select("id, routine_id, started_at, ended_at")
      .not("ended_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(12),
    supabase
      .from("workouts")
      .select("id", { count: "exact", head: true })
      .not("ended_at", "is", null),
  ]);

  const workouts = finished ?? [];
  if (workouts.length === 0) {
    return {
      lastWorkout: null,
      recentVolumes: [] as number[],
      totalWorkouts: 0,
      volume30d: 0,
      topSet: null as {
        exerciseName: string | null;
        weight: number;
        reps: number | null;
      } | null,
    };
  }

  const workoutIds = workouts.map((w) => w.id);

  const { data: workoutExercises } = await supabase
    .from("workout_exercises")
    .select("id, workout_id, exercise_id")
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
  const exerciseByWE = new Map(
    (workoutExercises ?? []).map((we) => [we.id, we.exercise_id]),
  );

  const volumeByWorkout = new Map<string, number>();
  for (const s of sets ?? []) {
    const workoutId = workoutByWE.get(s.workout_exercise_id);
    if (!workoutId) continue;
    const volume = (s.weight ?? 0) * (s.reps ?? 0);
    volumeByWorkout.set(workoutId, (volumeByWorkout.get(workoutId) ?? 0) + volume);
  }

  const last = workouts[0];

  // La serie más pesada de la última sesión: es el dato con el que el
  // usuario se acuerda de qué hizo la última vez.
  let topSet: { exerciseId: string; weight: number; reps: number | null } | null =
    null;
  for (const s of sets ?? []) {
    if (workoutByWE.get(s.workout_exercise_id) !== last.id) continue;
    if (s.weight == null) continue;
    if (!topSet || s.weight > topSet.weight) {
      topSet = {
        exerciseId: exerciseByWE.get(s.workout_exercise_id) ?? "",
        weight: s.weight,
        reps: s.reps,
      };
    }
  }

  // El nombre del ejercicio de la serie top se resuelve con una consulta
  // puntual: antes la home traía el catálogo entero solo para esto.
  let topSetExerciseName: string | null = null;
  if (topSet) {
    const { data } = await supabase
      .from("exercises")
      .select("name")
      .eq("id", topSet.exerciseId)
      .maybeSingle();
    topSetExerciseName = data?.name ?? null;
  }

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const volume30d = workouts
    .filter((w) => new Date(w.started_at).getTime() >= thirtyDaysAgo)
    .reduce((sum, w) => sum + (volumeByWorkout.get(w.id) ?? 0), 0);

  const exerciseCount = new Set(
    (workoutExercises ?? [])
      .filter((we) => we.workout_id === last.id)
      .map((we) => we.id),
  ).size;

  return {
    lastWorkout: {
      id: last.id,
      routineId: last.routine_id,
      startedAt: last.started_at,
      endedAt: last.ended_at,
      volume: volumeByWorkout.get(last.id) ?? 0,
      exerciseCount,
      durationMinutes: last.ended_at
        ? Math.round(
            (new Date(last.ended_at).getTime() -
              new Date(last.started_at).getTime()) /
              60000,
          )
        : null,
    },
    recentVolumes: workouts
      .slice(0, 8)
      .reverse()
      .map((w) => volumeByWorkout.get(w.id) ?? 0),
    totalWorkouts: totalWorkouts ?? workouts.length,
    volume30d,
    topSet: topSet
      ? {
          exerciseName: topSetExerciseName,
          weight: topSet.weight,
          reps: topSet.reps,
        }
      : null,
  };
}
