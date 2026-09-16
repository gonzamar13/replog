import { CheckIcon, ChevronLeftIcon, FlagIcon } from "@/components/icons";
import { ExercisePicker } from "@/components/exercise-picker";
import { Badge, ButtonLink, cn, SectionTitle } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import { getLastLoggedSets, listExercises } from "@/lib/data/exercises";
import { getRoutine, getRoutineExercises } from "@/lib/data/routines";
import {
  getSetsForWorkoutExercise,
  getWorkout,
  getWorkoutExercises,
} from "@/lib/data/workouts";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addExerciseAction,
  finishWorkoutAction,
  repeatWorkoutAction,
} from "../actions";
import { ExerciseLogger } from "./exercise-logger";
import { ElapsedTime, RestTimerBar, RestTimerProvider } from "./timers";

function repsLabel(min: number | null, max: number | null) {
  if (!min && !max) return null;
  if (min && max && min !== max) return `${min}–${max}`;
  return String(min ?? max);
}

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

  const [workoutExercises, exercises, routineExercises, routine] =
    await Promise.all([
      getWorkoutExercises(id),
      listExercises(),
      workout.routine_id ? getRoutineExercises(workout.routine_id) : [],
      workout.routine_id ? getRoutine(workout.routine_id) : null,
    ]);

  const exerciseById = new Map(exercises.map((e) => [e.id, e]));
  // Si la sesión viene de una rutina, esto trae el objetivo de series y el
  // descanso planeado por ejercicio.
  const targetByExercise = new Map(
    routineExercises.map((re) => [re.exercise_id, re]),
  );

  const logs = await Promise.all(
    workoutExercises.map(async (we) => {
      const [currentSets, previousSets] = await Promise.all([
        getSetsForWorkoutExercise(we.id),
        getLastLoggedSets(we.exercise_id, id),
      ]);
      return { we, currentSets, previousSets };
    }),
  );

  const totalSets = logs.reduce((sum, l) => sum + l.currentSets.length, 0);

  /* ── Sesión finalizada: modo lectura ───────────────────────── */
  if (isFinished) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 pt-6 pb-10 lg:px-8">
        <Link
          href="/historial"
          className="mb-3 inline-flex items-center gap-1 text-[13px] text-faint transition-colors hover:text-muted"
        >
          <ChevronLeftIcon width={16} height={16} /> Historial
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">
          {routine?.name ?? "Entrenamiento libre"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {new Date(workout.started_at).toLocaleDateString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>

        <div className="mt-6 space-y-5">
          {logs.map(({ we, currentSets }) => {
            const exercise = exerciseById.get(we.exercise_id);
            if (!exercise) return null;
            return (
              <div key={we.id}>
                <h2 className="text-base font-semibold">{exercise.name}</h2>
                <ul className="mt-2 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                  {currentSets.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center gap-3 px-3 py-2.5 text-[15px]"
                    >
                      <span className="w-14 shrink-0 text-[13px] text-faint">
                        Serie {s.set_number}
                      </span>
                      <span className="flex-1 font-semibold tabular-nums">
                        {s.weight ?? "—"}
                        <span className="ml-0.5 text-[13px] font-normal text-muted">
                          kg
                        </span>
                        <span className="mx-1.5 text-faint">×</span>
                        {s.reps ?? "—"}
                      </span>
                      {s.rir === 0 || (s.rir == null && s.is_failure) ? (
                        <Badge tone="warning">fallo</Badge>
                      ) : s.rir != null ? (
                        <Badge tone="neutral">RIR {s.rir}</Badge>
                      ) : null}
                      {s.note && (
                        <span className="max-w-32 truncate text-[12px] text-faint">
                          {s.note}
                        </span>
                      )}
                    </li>
                  ))}
                  {currentSets.length === 0 && (
                    <li className="px-3 py-2.5 text-[13px] text-faint">
                      Sin series registradas.
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <form action={repeatWorkoutAction} className="flex-1">
            <input type="hidden" name="workoutId" value={id} />
            <SubmitButton className="w-full" pendingLabel="Preparando…">
              Repetir esta sesión
            </SubmitButton>
          </form>
          <ButtonLink
            href={`/workout/${id}/resumen`}
            variant="secondary"
            className="flex-1"
          >
            Ver resumen
          </ButtonLink>
        </div>
      </main>
    );
  }

  /* ── Sesión en curso ────────────────────────────────────────── */
  return (
    <RestTimerProvider>
      <div className="mx-auto w-full max-w-xl px-4 pb-2 lg:px-8">
        <header className="sticky top-0 z-30 -mx-4 mb-4 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {routine?.name ?? "Entrenamiento libre"}
              </p>
              <p className="text-[11px] uppercase tracking-[0.1em] text-faint">
                {totalSets} {totalSets === 1 ? "serie" : "series"} ·{" "}
                {logs.length} {logs.length === 1 ? "ejercicio" : "ejercicios"}
              </p>
            </div>
            <p className="shrink-0 text-2xl font-bold tracking-tight text-accent">
              <ElapsedTime startedAt={workout.started_at} />
            </p>
          </div>

          {/* Salto rápido entre ejercicios: el punto se enciende cuando
              ese ejercicio ya cumplió su objetivo de series */}
          {logs.length > 1 && (
            <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 lg:-mx-8 lg:px-8">
              {logs.map(({ we, currentSets }) => {
                const exercise = exerciseById.get(we.exercise_id);
                if (!exercise) return null;
                const target = targetByExercise.get(we.exercise_id);
                const complete =
                  target?.target_sets != null &&
                  currentSets.length >= target.target_sets;
                return (
                  <a
                    key={we.id}
                    href={`#ex-${we.id}`}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1 text-[12px] font-medium transition-colors",
                      complete
                        ? "border-accent/30 bg-accent/10 text-accent"
                        : "text-muted hover:text-ink",
                    )}
                  >
                    {complete && <CheckIcon width={12} height={12} />}
                    {exercise.name}
                  </a>
                );
              })}
            </div>
          )}
        </header>

        {/* Mazo horizontal: un ejercicio por tarjeta, a pantalla
            completa. scroll-snap nativo — sin librerías de gestos,
            funciona con el dedo, con trackpad y con teclado. */}
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 lg:-mx-8 lg:px-8">
          {logs.map(({ we, currentSets, previousSets }) => {
            const exercise = exerciseById.get(we.exercise_id);
            if (!exercise) return null;
            const target = targetByExercise.get(we.exercise_id);

            return (
              <section
                key={we.id}
                id={`ex-${we.id}`}
                className="h-[calc(100dvh-15rem)] min-h-96 w-full shrink-0 snap-center scroll-ml-4"
              >
                <ExerciseLogger
                  workoutId={id}
                  workoutExerciseId={we.id}
                  exercise={exercise}
                  previousSets={previousSets}
                  currentSets={currentSets}
                  targetSets={target?.target_sets ?? null}
                  targetReps={
                    target
                      ? repsLabel(target.target_reps_min, target.target_reps_max)
                      : null
                  }
                  restSeconds={target?.target_rest_seconds ?? 90}
                />
              </section>
            );
          })}

          {/* Última tarjeta del mazo: sumar un ejercicio */}
          <section className="h-[calc(100dvh-15rem)] min-h-96 w-full shrink-0 snap-center overflow-y-auto">
            <SectionTitle>Agregar ejercicio</SectionTitle>
            <ExercisePicker
              exercises={exercises}
              action={addExerciseAction}
              hiddenFields={{ workoutId: id }}
            />
          </section>
        </div>
      </div>

      {/* Pie fijo: descanso + única acción de cierre */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:px-8">
        <div className="mx-auto w-full max-w-xl">
          <RestTimerBar />
          <form action={finishWorkoutAction}>
            <input type="hidden" name="workoutId" value={id} />
            <SubmitButton
              variant="secondary"
              className="w-full"
              pendingLabel="Cerrando…"
            >
              <FlagIcon width={16} height={16} />
              Finalizar entrenamiento
            </SubmitButton>
          </form>
        </div>
      </div>
    </RestTimerProvider>
  );
}
