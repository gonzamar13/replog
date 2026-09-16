import { requireUser } from "@/lib/auth";
import { listExercises } from "@/lib/data/exercises";
import { getRoutineGroup } from "@/lib/data/routine-groups";
import { getRoutine, getRoutineExercises } from "@/lib/data/routines";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addExerciseToRoutineAction,
  deleteRoutineAction,
  moveRoutineExerciseAction,
  removeRoutineExerciseAction,
  renameRoutineAction,
  startWorkoutFromRoutineAction,
} from "../actions";

export default async function RoutineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await requireUser();

  // getRoutine ya está limitado por RLS al dueño.
  const routine = await getRoutine(id);
  if (!routine) notFound();

  const [routineExercises, exercises, group] = await Promise.all([
    getRoutineExercises(id),
    listExercises(),
    routine.group_id ? getRoutineGroup(routine.group_id) : null,
  ]);

  const exerciseById = new Map(exercises.map((e) => [e.id, e]));

  return (
    <main className="mx-auto max-w-md p-4 pb-28">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{routine.name}</h1>
        <Link href="/rutinas" className="text-sm text-neutral-500">
          Rutinas
        </Link>
      </div>
      {group && (
        <p className="mb-3 text-xs text-neutral-400">{group.name}</p>
      )}

      <details className="mb-4">
        <summary className="cursor-pointer text-sm text-neutral-500">
          Renombrar rutina
        </summary>
        <form action={renameRoutineAction} className="mt-2 flex gap-2">
          <input type="hidden" name="routineId" value={id} />
          <input
            type="text"
            name="name"
            required
            defaultValue={routine.name}
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium"
          >
            Guardar
          </button>
        </form>
      </details>

      <div className="space-y-2">
        {routineExercises.map((re, index) => {
          const exercise = exerciseById.get(re.exercise_id);
          if (!exercise) return null;
          return (
            <div
              key={re.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{exercise.name}</p>
                <p className="text-xs text-neutral-500">
                  {re.target_sets} × {re.target_reps_min ?? "?"}
                  {re.target_reps_max && re.target_reps_max !== re.target_reps_min
                    ? `–${re.target_reps_max}`
                    : ""}
                  {re.target_rest_seconds
                    ? ` · descanso ${re.target_rest_seconds}s`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <form action={moveRoutineExerciseAction}>
                  <input type="hidden" name="routineId" value={id} />
                  <input type="hidden" name="routineExerciseId" value={re.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button
                    type="submit"
                    disabled={index === 0}
                    className="text-xs text-neutral-400 disabled:opacity-30"
                  >
                    ↑
                  </button>
                </form>
                <form action={moveRoutineExerciseAction}>
                  <input type="hidden" name="routineId" value={id} />
                  <input type="hidden" name="routineExerciseId" value={re.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button
                    type="submit"
                    disabled={index === routineExercises.length - 1}
                    className="text-xs text-neutral-400 disabled:opacity-30"
                  >
                    ↓
                  </button>
                </form>
                <form action={removeRoutineExerciseAction}>
                  <input type="hidden" name="routineId" value={id} />
                  <input
                    type="hidden"
                    name="routineExerciseId"
                    value={re.id}
                  />
                  <button
                    type="submit"
                    className="text-xs text-neutral-400 underline"
                  >
                    quitar
                  </button>
                </form>
              </div>
            </div>
          );
        })}

        {routineExercises.length === 0 && (
          <p className="text-sm text-neutral-500">
            Todavía no agregaste ejercicios.
          </p>
        )}
      </div>

      <form
        action={addExerciseToRoutineAction}
        className="mt-4 space-y-2 rounded-lg border border-neutral-200 p-3"
      >
        <input type="hidden" name="routineId" value={id} />
        <select
          name="exerciseId"
          required
          defaultValue=""
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Elegir ejercicio…
          </option>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.muscle_group ? `${ex.muscle_group} — ` : ""}
              {ex.name}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <label className="flex-1 text-xs text-neutral-500">
            Series
            <input
              type="number"
              name="targetSets"
              defaultValue={3}
              min={1}
              className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-2 text-sm"
            />
          </label>
          <label className="flex-1 text-xs text-neutral-500">
            Reps min
            <input
              type="number"
              name="targetRepsMin"
              defaultValue={8}
              min={1}
              className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-2 text-sm"
            />
          </label>
          <label className="flex-1 text-xs text-neutral-500">
            Reps max
            <input
              type="number"
              name="targetRepsMax"
              defaultValue={10}
              min={1}
              className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-2 text-sm"
            />
          </label>
          <label className="flex-1 text-xs text-neutral-500">
            Descanso (s)
            <input
              type="number"
              name="targetRestSeconds"
              defaultValue={90}
              min={0}
              step={15}
              className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-2 text-sm"
            />
          </label>
        </div>

        <button
          type="submit"
          className="w-full rounded-md border border-neutral-300 py-2 text-sm font-medium"
        >
          Agregar a la rutina
        </button>
      </form>

      <form action={deleteRoutineAction} className="mt-3">
        <input type="hidden" name="routineId" value={id} />
        <button type="submit" className="text-xs text-neutral-400 underline">
          Eliminar rutina
        </button>
      </form>

      {routineExercises.length > 0 && (
        <form
          action={startWorkoutFromRoutineAction}
          className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white p-4"
        >
          <input type="hidden" name="routineId" value={id} />
          <button
            type="submit"
            className="mx-auto block w-full max-w-md rounded-lg bg-neutral-900 py-3 text-sm font-medium text-white"
          >
            🏋️ Empezar entrenamiento
          </button>
        </form>
      )}
    </main>
  );
}
