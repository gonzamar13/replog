"use server";

import { createExercise } from "@/lib/data/exercises";
import { revalidatePath } from "next/cache";

export async function createExerciseAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  const muscleGroup = (formData.get("muscleGroup") as string)?.trim() || null;

  await createExercise({ name, muscleGroup });
  revalidatePath("/ejercicios");
}
