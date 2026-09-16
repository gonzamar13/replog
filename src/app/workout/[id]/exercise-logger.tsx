"use client";

import type { Exercise } from "@/lib/data/exercises";
import type { WorkoutSet } from "@/lib/data/sets";
import { deleteSetAction, logSetAction } from "../actions";
import { RestTimer } from "./rest-timer";

export function ExerciseLogger({
  workoutId,
  workoutExerciseId,
  exercise,
  previousSets,
  currentSets,
  targetSets,
  restSeconds,
}: {
  workoutId: string;
  workoutExerciseId: string;
  exercise: Exercise;
  previousSets: WorkoutSet[] | null;
  currentSets: WorkoutSet[];
  targetSets: number | null;
  restSeconds: number;
}) {
  // Referencia para prellenar la serie nueva: la última serie de esta
  // sesión si ya hay alguna, si no la última serie de la sesión anterior.
  const reference =
    currentSets[currentSets.length - 1] ??
    (previousSets ? previousSets[previousSets.length - 1] : null);

  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-medium">{exercise.name}</h2>
        {exercise.muscle_group && (
          <span className="text-xs text-neutral-400">
            {exercise.muscle_group}
          </span>
        )}
      </div>

      {previousSets && previousSets.length > 0 && (
        <p className="mt-1 text-xs text-neutral-500">
          Última vez:{" "}
          {previousSets
            .map((s) => `${s.weight ?? "—"}×${s.reps ?? "—"}`)
            .join(", ")}
        </p>
      )}

      {targetSets && (
        <p className="mt-1 text-xs text-neutral-400">
          Serie {Math.min(currentSets.length + 1, targetSets)} de {targetSets}
        </p>
      )}

      {currentSets.length > 0 && (
        <ul className="mt-3 space-y-1">
          {currentSets.map((s) => (
            <li key={s.id} className="flex items-center justify-between text-sm">
              <span>
                Serie {s.set_number}: {s.weight ?? "—"}kg × {s.reps ?? "—"}
                {s.is_failure && <span className="ml-1 text-red-600">fallo</span>}
              </span>
              <form action={deleteSetAction}>
                <input type="hidden" name="workoutId" value={workoutId} />
                <input type="hidden" name="setId" value={s.id} />
                <button type="submit" className="text-xs text-neutral-400 underline">
                  deshacer
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {currentSets.length > 0 && (
        <RestTimer key={currentSets.length} seconds={restSeconds} />
      )}

      {/* key fuerza el remount cuando se confirma una serie, así el
          defaultValue vuelve a tomar la referencia actualizada */}
      <form
        key={currentSets.length}
        action={logSetAction}
        className="mt-3 flex items-end gap-2"
      >
        <input type="hidden" name="workoutId" value={workoutId} />
        <input type="hidden" name="workoutExerciseId" value={workoutExerciseId} />

        <label className="flex-1 text-xs text-neutral-500">
          Kg
          <input
            type="number"
            name="weight"
            step="0.5"
            inputMode="decimal"
            defaultValue={reference?.weight ?? ""}
            className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-2 text-sm"
          />
        </label>

        <label className="flex-1 text-xs text-neutral-500">
          Reps
          <input
            type="number"
            name="reps"
            inputMode="numeric"
            defaultValue={reference?.reps ?? ""}
            className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-2 text-sm"
          />
        </label>

        <label className="flex items-center gap-1 pb-2 text-xs text-neutral-500">
          <input type="checkbox" name="isFailure" />
          Fallo
        </label>

        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          ✓
        </button>
      </form>
    </div>
  );
}
