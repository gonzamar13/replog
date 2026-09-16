"use server";

import { createRoutineGroup } from "@/lib/data/routine-groups";
import {
  addExerciseToRoutine,
  createRoutine,
  deleteRoutine,
  moveRoutineExercise,
  removeRoutineExercise,
  renameRoutine,
  updateRoutineDays,
  updateRoutineGroup,
} from "@/lib/data/routines";
import { createWorkoutFromRoutine } from "@/lib/data/workouts";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createRoutineAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  const groupId = (formData.get("groupId") as string) || null;
  const routineId = await createRoutine(name, groupId);
  redirect(`/rutinas/${routineId}`);
}

export async function createRoutineGroupAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  const startsOnRaw = formData.get("startsOn") as string;
  const endsOnRaw = formData.get("endsOn") as string;

  await createRoutineGroup({
    name,
    startsOn: startsOnRaw || null,
    endsOn: endsOnRaw || null,
  });

  revalidatePath("/rutinas");
}

export async function moveRoutineToGroupAction(formData: FormData) {
  const routineId = formData.get("routineId") as string;
  if (!routineId) return;

  const groupId = (formData.get("groupId") as string) || null;

  await updateRoutineGroup(routineId, groupId);
  revalidatePath(`/rutinas/${routineId}`);
  revalidatePath("/rutinas");
}

export async function updateRoutineDaysAction(formData: FormData) {
  const routineId = formData.get("routineId") as string;
  if (!routineId) return;

  const days = formData.getAll("days").map((d) => Number(d));

  await updateRoutineDays(routineId, days);
  revalidatePath(`/rutinas/${routineId}`);
  revalidatePath("/rutinas");
  revalidatePath("/");
}

export async function renameRoutineAction(formData: FormData) {
  const routineId = formData.get("routineId") as string;
  const name = (formData.get("name") as string)?.trim();
  if (!routineId || !name) return;

  await renameRoutine(routineId, name);
  revalidatePath(`/rutinas/${routineId}`);
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

export async function moveRoutineExerciseAction(formData: FormData) {
  const routineId = formData.get("routineId") as string;
  const routineExerciseId = formData.get("routineExerciseId") as string;
  const direction = formData.get("direction") as "up" | "down";

  await moveRoutineExercise(routineId, routineExerciseId, direction);
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
