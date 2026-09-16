"use server";

import {
  addExerciseToRoutine,
  createRoutine,
  deleteRoutine,
  removeRoutineExercise,
} from "@/lib/data/routines";
import { createWorkoutFromRoutine } from "@/lib/data/workouts";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createRoutineAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  const routineId = await createRoutine(name);
  redirect(`/rutinas/${routineId}`);
}

export async function addExerciseToRoutineAction(formData: FormData) {
  const routineId = formData.get("routineId") as string;
  const exerciseId = formData.get("exerciseId") as string;
  if (!routineId || !exerciseId) return;

  const targetSets = Number(formData.get("targetSets")) || 3;
  const repsMinRaw = formData.get("targetRepsMin") as string;
  const repsMaxRaw = formData.get("targetRepsMax") as string;
  const restRaw = formData.get("targetRestSeconds") as string;

  await addExerciseToRoutine({
    routineId,
    exerciseId,
    targetSets,
    targetRepsMin: repsMinRaw ? Number(repsMinRaw) : null,
    targetRepsMax: repsMaxRaw ? Number(repsMaxRaw) : null,
    targetRestSeconds: restRaw ? Number(restRaw) : 90,
  });

  revalidatePath(`/rutinas/${routineId}`);
}

export async function removeRoutineExerciseAction(formData: FormData) {
  const routineId = formData.get("routineId") as string;
  const routineExerciseId = formData.get("routineExerciseId") as string;

  await removeRoutineExercise(routineExerciseId);
  revalidatePath(`/rutinas/${routineId}`);
}

export async function deleteRoutineAction(formData: FormData) {
  const routineId = formData.get("routineId") as string;
  await deleteRoutine(routineId);
  redirect("/rutinas");
}

export async function startWorkoutFromRoutineAction(formData: FormData) {
  const routineId = formData.get("routineId") as string;
  const workoutId = await createWorkoutFromRoutine(routineId);
  redirect(`/workout/${workoutId}`);
}
