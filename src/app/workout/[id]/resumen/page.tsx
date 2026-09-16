import { TrophyIcon } from "@/components/icons";
import { ButtonLink, Page, StatTile } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { listExercises } from "@/lib/data/exercises";
import { getSessionPRs } from "@/lib/data/progress";
import { getRoutine } from "@/lib/data/routines";
import { getWorkout, getWorkoutSummary } from "@/lib/data/workouts";
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

  const [summary, prs, exercises, routine] = await Promise.all([
    getWorkoutSummary(id),
    getSessionPRs(id),
    listExercises(),
    workout.routine_id ? getRoutine(workout.routine_id) : null,
  ]);

  const exerciseById = new Map(exercises.map((e) => [e.id, e]));

  return (
    <Page className="pb-14">
      <div className="animate-pop text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
          Entrenamiento terminado
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          {routine?.name ?? "Entrenamiento libre"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {new Date(workout.started_at).toLocaleDateString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <StatTile
          label="Duración"
          value={summary.durationMinutes ?? "—"}
          unit="min"
          accent
        />
        <StatTile label="Series" value={summary.totalSets} />
        <StatTile
          label="Volumen"
          value={summary.totalVolume.toLocaleString("es-AR")}
          unit="kg"
        />
        <StatTile label="Ejercicios" value={summary.exerciseCount} />
      </div>

      {prs.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
            Nuevos récords
          </h2>
          <ul className="animate-pop space-y-2">
            {prs.map((pr) => {
              const exercise = exerciseById.get(pr.exerciseId);
              if (!exercise) return null;
              return (
                <li
                  key={pr.exerciseId}
                  className="flex items-center gap-3 rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3"
                >
                  <TrophyIcon className="shrink-0 text-accent" />
                  <span className="flex-1 text-sm font-semibold">
                    {exercise.name}
                  </span>
                  <span className="text-[15px] font-bold tabular-nums text-accent">
                    {pr.weight}
                    <span className="text-[13px] font-medium"> kg</span>
                    <span className="mx-1 text-accent/60">×</span>
                    {pr.reps ?? "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <ButtonLink href="/" className="flex-1">
          Listo
        </ButtonLink>
        <ButtonLink href={`/workout/${id}`} variant="secondary" className="flex-1">
          Ver detalle
        </ButtonLink>
      </div>
    </Page>
  );
}
