import { requireUser } from "@/lib/auth";
import { getLastLoggedSets, listExercises } from "@/lib/data/exercises";
import {
  getSetsForWorkoutExercise,
  getWorkout,
  getWorkoutExercises,
} from "@/lib/data/workouts";
import { notFound } from "next/navigation";
import { addExerciseAction, finishWorkoutAction } from "../actions";
import { ExerciseLogger } from "./exercise-logger";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await requireUser();

  // getWorkout ya está limitado por RLS al dueño — si el id es de otro
  // usuario o no existe, esto devuelve null.
  const workout = await getWorkout(id);
  if (!workout) notFound();

  const isFinished = workout.ended_at !== null;

  const [workoutExercises, exercises] = await Promise.all([
    getWorkoutExercises(id),
    listExercises(),
  ]);

  const exerciseById = new Map(exercises.map((e) => [e.id, e]));

  const logs = await Promise.all(
    workoutExercises.map(async (we) => {
      const [currentSets, previousSets] = await Promise.all([
        getSetsForWorkoutExercise(we.id),
        getLastLoggedSets(we.exercise_id, id),
      ]);
      return { we, currentSets, previousSets };
    }),
  );

  return (
    <main className="mx-auto max-w-md p-4 pb-28">
      <header className="mb-4">
        <h1 className="text-lg font-semibold">
          {isFinished ? "Entrenamiento finalizado" : "Entrenamiento en curso"}
        </h1>
        <p className="text-xs text-neutral-500">
          Empezó a las{" "}
          {new Date(workout.started_at).toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </header>

      <div className="space-y-4">
        {logs.map(({ we, currentSets, previousSets }) => {
          const exercise = exerciseById.get(we.exercise_id);
          if (!exercise) return null;

          if (isFinished) {
            return (
              <div key={we.id} className="rounded-lg border border-neutral-200 p-4">
                <h2 className="font-medium">{exercise.name}</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {currentSets
                    .map((s) => `${s.weight ?? "—"}kg × ${s.reps ?? "—"}`)
                    .join(", ") || "Sin series registradas"}
                </p>
              </div>
            );
          }

          return (
            <ExerciseLogger
              key={we.id}
              workoutId={id}
              workoutExerciseId={we.id}
              exercise={exercise}
              previousSets={previousSets}
              currentSets={currentSets}
            />
          );
        })}

        {logs.length === 0 && (
          <p className="text-sm text-neutral-500">
            Todavía no agregaste ningún ejercicio.
          </p>
        )}
      </div>

      {!isFinished && (
        <>
          <form action={addExerciseAction} className="mt-4 flex gap-2">
            <input type="hidden" name="workoutId" value={id} />
            <select
              name="exerciseId"
              required
              defaultValue=""
              className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
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
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium"
            >
              Agregar
            </button>
          </form>

          <form
            action={finishWorkoutAction}
            className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white p-4"
          >
            <input type="hidden" name="workoutId" value={id} />
            <button
              type="submit"
              className="mx-auto block w-full max-w-md rounded-lg bg-neutral-900 py-3 text-sm font-medium text-white"
            >
              Finalizar entrenamiento
            </button>
          </form>
        </>
      )}
    </main>
  );
}
