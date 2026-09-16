"use server";

import { createSet, deleteSet } from "@/lib/data/sets";
import {
  addExerciseToWorkout,
  createWorkout,
  finishWorkout,
  repeatWorkout,
} from "@/lib/data/workouts";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function startWorkoutAction() {
  const workoutId = await createWorkout();
  redirect(`/workout/${workoutId}`);
}

export async function repeatWorkoutAction(formData: FormData) {
  const sourceWorkoutId = formData.get("workoutId") as string;
  const newWorkoutId = await repeatWorkout(sourceWorkoutId);
  redirect(`/workout/${newWorkoutId}`);
}

export async function addExerciseAction(formData: FormData) {
  const workoutId = formData.get("workoutId") as string;
  const exerciseId = formData.get("exerciseId") as string;
  if (!workoutId || !exerciseId) return;

  await addExerciseToWorkout(workoutId, exerciseId);
  revalidatePath(`/workout/${workoutId}`);
}

export async function logSetAction(formData: FormData) {
  const workoutId = formData.get("workoutId") as string;
  const workoutExerciseId = formData.get("workoutExerciseId") as string;
  const weightRaw = formData.get("weight") as string;
  const repsRaw = formData.get("reps") as string;
  const rirRaw = formData.get("rir") as string;

  await createSet({
    workoutExerciseId,
    weight: weightRaw ? Number(weightRaw) : null,
    reps: repsRaw ? Number(repsRaw) : null,
    isFailure: formData.get("isFailure") === "on",
    rir: rirRaw === "" || rirRaw == null ? null : Number(rirRaw),
    note: (formData.get("note") as string)?.trim() || null,
  });

  revalidatePath(`/workout/${workoutId}`);
}

export async function deleteSetAction(formData: FormData) {
  const workoutId = formData.get("workoutId") as string;
  const setId = formData.get("setId") as string;

  await deleteSet(setId);
  revalidatePath(`/workout/${workoutId}`);
}

export async function finishWorkoutAction(formData: FormData) {
  const workoutId = formData.get("workoutId") as string;
  await finishWorkout(workoutId);
  redirect(`/workout/${workoutId}/resumen`);
}
