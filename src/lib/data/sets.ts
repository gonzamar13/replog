import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type WorkoutSet = Database["public"]["Tables"]["sets"]["Row"];

export async function createSet(input: {
  workoutExerciseId: string;
  weight: number | null;
  reps: number | null;
  isFailure: boolean;
  note?: string | null;
}) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("sets")
    .select("id", { count: "exact", head: true })
    .eq("workout_exercise_id", input.workoutExerciseId);

  const { error } = await supabase.from("sets").insert({
    workout_exercise_id: input.workoutExerciseId,
    set_number: (count ?? 0) + 1,
    weight: input.weight,
    reps: input.reps,
    is_failure: input.isFailure,
    note: input.note ?? null,
  });

  if (error) throw error;
}

export async function deleteSet(setId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("sets").delete().eq("id", setId);
  if (error) throw error;
}
