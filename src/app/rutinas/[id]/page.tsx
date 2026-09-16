import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlayIcon,
  TrashIcon,
} from "@/components/icons";
import {
  Badge,
  Input,
  MetaLine,
  Page,
  PageHeader,
  SectionTitle,
  Select,
} from "@/components/ui";
import { ExercisePicker } from "@/components/exercise-picker";
import { IconSubmit, SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import { formatDays, WEEK_DAYS } from "@/lib/days";
import { listExercises } from "@/lib/data/exercises";
import { getRoutineGroup } from "@/lib/data/routine-groups";
import { listRoutineGroups } from "@/lib/data/routine-groups";
import {
  getRoutine,
  getRoutineExercises,
  getRoutineStats,
} from "@/lib/data/routines";
import { notFound } from "next/navigation";
import {
  addExerciseToRoutineAction,
  deleteRoutineAction,
  moveRoutineExerciseAction,
  moveRoutineToGroupAction,
  removeRoutineExerciseAction,
  renameRoutineAction,
  startWorkoutFromRoutineAction,
  updateRoutineDaysAction,
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

  const [routineExercises, exercises, group, stats, allGroups] =
    await Promise.all([
      getRoutineExercises(id),
      listExercises(),
      routine.group_id ? getRoutineGroup(routine.group_id) : null,
      getRoutineStats(),
      listRoutineGroups(),
    ]);

  const stat = stats.get(id);

  const exerciseById = new Map(exercises.map((e) => [e.id, e]));

  return (
    <Page className="pb-40">
      <PageHeader
        title={routine.name}
        back={{ href: "/rutinas", label: "Rutinas" }}
        subtitle={
          <>
            {group && (
              <Badge tone="accent" className="mr-2">
                {group.name}
              </Badge>
            )}
            {[
              `${routineExercises.length} ${routineExercises.length === 1 ? "ejercicio" : "ejercicios"}`,
              stat?.typicalMinutes ? `~${stat.typicalMinutes} min` : null,
              formatDays(routine.days),
            ]
              .filter(Boolean)
              .join(" · ")}
          </>
        }
      />

      {/* Días de la semana en que toca esta rutina */}
      <form action={updateRoutineDaysAction} className="mb-7">
        <input type="hidden" name="routineId" value={id} />
        <SectionTitle>Días</SectionTitle>
        <div className="flex gap-1.5">
          {WEEK_DAYS.map((day) => (
            <label key={day.value} className="flex-1 cursor-pointer">
              <input
                type="checkbox"
                name="days"
                value={day.value}
                defaultChecked={(routine.days ?? []).includes(day.value)}
                aria-label={day.label}
                className="peer sr-only"
              />
              <span className="flex h-10 items-center justify-center rounded-xl border border-line bg-surface text-[13px] font-semibold text-muted transition-colors peer-checked:border-accent/40 peer-checked:bg-accent/15 peer-checked:text-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                {day.short}
              </span>
            </label>
          ))}
        </div>
        <SubmitButton
          variant="ghost"
          size="sm"
          className="mt-2"
          pendingLabel="Guardando…"
        >
          Guardar días
        </SubmitButton>
      </form>

      <SectionTitle>Ejercicios</SectionTitle>
      <ul className="space-y-2">
        {routineExercises.map((re, index) => {
          const exercise = exerciseById.get(re.exercise_id);
          if (!exercise) return null;

          const reps =
            re.target_reps_min && re.target_reps_max
              ? re.target_reps_min === re.target_reps_max
                ? `${re.target_reps_min}`
                : `${re.target_reps_min}–${re.target_reps_max}`
              : (re.target_reps_min ?? re.target_reps_max ?? null);

          return (
            <li
              key={re.id}
              className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3"
            >
              <span className="w-5 shrink-0 text-[13px] tabular-nums text-faint">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{exercise.name}</p>
                <MetaLine
                  className="mt-0.5"
                  items={[
                    reps ? `${re.target_sets} × ${reps}` : `${re.target_sets} series`,
                    re.target_rest_seconds
                      ? `${re.target_rest_seconds} s`
                      : null,
                    exercise.muscle_group,
                  ]}
                />
              </div>

              <div className="flex shrink-0 items-center">
                <form action={moveRoutineExerciseAction}>
                  <input type="hidden" name="routineId" value={id} />
                  <input type="hidden" name="routineExerciseId" value={re.id} />
                  <input type="hidden" name="direction" value="up" />
                  <IconSubmit label="Subir" disabled={index === 0}>
                    <ArrowUpIcon width={15} height={15} />
                  </IconSubmit>
                </form>
                <form action={moveRoutineExerciseAction}>
                  <input type="hidden" name="routineId" value={id} />
                  <input type="hidden" name="routineExerciseId" value={re.id} />
                  <input type="hidden" name="direction" value="down" />
                  <IconSubmit
                    label="Bajar"
                    disabled={index === routineExercises.length - 1}
                  >
                    <ArrowDownIcon width={15} height={15} />
                  </IconSubmit>
                </form>
                <form action={removeRoutineExerciseAction}>
                  <input type="hidden" name="routineId" value={id} />
                  <input type="hidden" name="routineExerciseId" value={re.id} />
                  <IconSubmit label="Quitar de la rutina">
                    <TrashIcon width={15} height={15} />
                  </IconSubmit>
                </form>
              </div>
            </li>
          );
        })}

        {routineExercises.length === 0 && (
          <li className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
            Agregá el primer ejercicio abajo.
          </li>
        )}
      </ul>

      {/* Agregar ejercicio */}
      <div className="mt-6 rounded-2xl border border-dashed border-line p-4">
        <SectionTitle>Agregar ejercicio</SectionTitle>
        <ExercisePicker
          exercises={exercises}
          action={addExerciseToRoutineAction}
          hiddenFields={{ routineId: id }}
          withTarget
        />
      </div>

      {/* Acciones destructivas / secundarias, deliberadamente discretas */}
      <details className="mt-6">
        <summary className="cursor-pointer list-none text-[13px] text-faint transition-colors hover:text-muted">
          Editar rutina
        </summary>
        <div className="mt-3 space-y-3">
          <form action={renameRoutineAction} className="flex gap-2">
            <input type="hidden" name="routineId" value={id} />
            <Input
              type="text"
              name="name"
              required
              defaultValue={routine.name}
              className="flex-1"
              aria-label="Nombre de la rutina"
            />
            <SubmitButton variant="secondary" pendingLabel="…">
              Guardar
            </SubmitButton>
          </form>

          {allGroups.length > 0 && (
            <form action={moveRoutineToGroupAction} className="flex gap-2">
              <input type="hidden" name="routineId" value={id} />
              <Select
                name="groupId"
                defaultValue={routine.group_id ?? ""}
                className="flex-1"
                aria-label="Programa"
              >
                <option value="">Sin programa</option>
                {allGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
              <SubmitButton variant="secondary" pendingLabel="…">
                Mover
              </SubmitButton>
            </form>
          )}

          <form action={deleteRoutineAction}>
            <input type="hidden" name="routineId" value={id} />
            <SubmitButton variant="danger" size="sm" pendingLabel="Eliminando…">
              Eliminar rutina
            </SubmitButton>
          </form>
        </div>
      </details>

      {/* Se apoya justo encima de la tab bar en móvil; al ras abajo en desktop */}
      {routineExercises.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:px-8 lg:pb-5">
          <form
            action={startWorkoutFromRoutineAction}
            className="mx-auto w-full max-w-xl"
          >
            <input type="hidden" name="routineId" value={id} />
            <SubmitButton
              size="lg"
              className="w-full"
              pendingLabel="Preparando…"
            >
              <PlayIcon width={18} height={18} />
              Empezar entrenamiento
            </SubmitButton>
          </form>
        </div>
      )}
    </Page>
  );
}
