import { requireUser } from "@/lib/auth";
import { listExercises } from "@/lib/data/exercises";
import { getSessionPRs } from "@/lib/data/progress";
import { getWorkout, getWorkoutSummary } from "@/lib/data/workouts";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function WorkoutSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();

  const workout = await getWorkout(id);
  if (!workout) notFound();
  if (!workout.ended_at) redirect(`/workout/${id}`);

  const [summary, prs, exercises] = await Promise.all([
    getWorkoutSummary(id),
    getSessionPRs(id),
    listExercises(),
  ]);

  const exerciseById = new Map(exercises.map((e) => [e.id, e]));

  return (
    <main className="mx-auto max-w-md p-4 text-center">
      <h1 className="text-lg font-semibold">Entrenamiento terminado 💪</h1>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-neutral-200 p-4">
          <p className="text-2xl font-semibold">
            {summary.durationMinutes ?? "—"}
          </p>
          <p className="text-xs text-neutral-500">minutos</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4">
          <p className="text-2xl font-semibold">{summary.totalSets}</p>
          <p className="text-xs text-neutral-500">series</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4">
          <p className="text-2xl font-semibold">{summary.totalVolume}kg</p>
          <p className="text-xs text-neutral-500">volumen total</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4">
          <p className="text-2xl font-semibold">{summary.exerciseCount}</p>
          <p className="text-xs text-neutral-500">ejercicios</p>
        </div>
      </div>

      {prs.length > 0 && (
        <div className="mt-6 text-left">
          <h2 className="mb-2 text-sm font-medium">🏆 Nuevos récords</h2>
          <ul className="space-y-1">
            {prs.map((pr) => {
              const exercise = exerciseById.get(pr.exerciseId);
              if (!exercise) return null;
              return (
                <li
                  key={pr.exerciseId}
                  className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
                >
                  {exercise.name}: {pr.weight}kg × {pr.reps ?? "—"}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Link
        href="/"
        className="mt-6 block rounded-lg bg-neutral-900 py-3 text-sm font-medium text-white"
      >
        Volver a Inicio
      </Link>
    </main>
  );
}
