import { Logo } from "@/components/app-nav";
import {
  ArrowUpIcon,
  ChevronRightIcon,
  PlayIcon,
  TrophyIcon,
} from "@/components/icons";
import {
  Badge,
  ButtonLink,
  MetaLine,
  Panel,
  SectionTitle,
} from "@/components/ui";
import { Sparkbars } from "@/components/ui/chart";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import { formatDays, todayIso } from "@/lib/days";
import { getHomeSummary } from "@/lib/data/home";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getPersonalRecords } from "@/lib/data/progress";
import { getRoutineStats, listRoutines } from "@/lib/data/routines";
import { getActiveWorkout } from "@/lib/data/workouts";
import Link from "next/link";
import { startWorkoutFromRoutineAction } from "./rutinas/actions";
import { startWorkoutAction } from "./workout/actions";

export default async function Home() {
  const user = await requireUser();

  // Todo en paralelo: getRoutineStats estaba con un await suelto después
  // del Promise.all y sumaba un viaje de red en serie.
  const [profile, activeWorkout, summary, routines, records, routineStats] =
    await Promise.all([
      getCurrentProfile(),
      getActiveWorkout(),
      getHomeSummary(),
      listRoutines(),
      getPersonalRecords(),
      getRoutineStats(),
    ]);

  const name = profile?.display_name || user.email?.split("@")[0] || "";
  const routineById = new Map(routines.map((r) => [r.id, r]));

  const last = summary.lastWorkout;
  const lastRoutine = last?.routineId ? routineById.get(last.routineId) : null;
  // Prioridad: la rutina que toca hoy según sus días; si no hay ninguna
  // agendada, la última que usaste; si nunca usaste una, la primera.
  const today = todayIso();
  const todayRoutine =
    routines.find((r) => (r.days ?? []).includes(today)) ?? null;
  const suggested = todayRoutine ?? lastRoutine ?? routines[0] ?? null;

  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-6 pb-28 lg:max-w-5xl lg:px-8 lg:pt-10 lg:pb-14">
      <header className="mb-6 flex items-baseline justify-between">
        <div>
          <Logo className="text-sm text-muted lg:hidden" />
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Hola{name ? `, ${name}` : ""}
          </h1>
        </div>
        <p className="text-[13px] text-faint">
          {new Date().toLocaleDateString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "short",
          })}
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-3">
          {/* Acción principal — responde "¿qué hago ahora?" */}
          {activeWorkout ? (
            <ButtonLink
              href={`/workout/${activeWorkout.id}`}
              size="lg"
              className="w-full"
            >
              <PlayIcon width={18} height={18} />
              Continuar entrenamiento
            </ButtonLink>
          ) : todayRoutine ? (
            /* Si hoy toca una rutina, el botón principal la arranca
               directo: un toque desde abrir la app hasta registrar. */
            <form action={startWorkoutFromRoutineAction}>
              <input type="hidden" name="routineId" value={todayRoutine.id} />
              <SubmitButton
                size="lg"
                className="w-full"
                pendingLabel="Preparando…"
              >
                <PlayIcon width={18} height={18} />
                Comenzar {todayRoutine.name}
              </SubmitButton>
            </form>
          ) : (
            <form action={startWorkoutAction}>
              <SubmitButton
                size="lg"
                className="w-full"
                pendingLabel="Preparando…"
              >
                <PlayIcon width={18} height={18} />
                Comenzar entrenamiento
              </SubmitButton>
            </form>
          )}

          {suggested && !activeWorkout && (
            <Link
              href={`/rutinas/${suggested.id}`}
              className="mt-3 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 transition-colors hover:border-muted/40"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.1em] text-faint">
                  {todayRoutine
                    ? "Hoy te toca"
                    : lastRoutine
                      ? "Tu última rutina"
                      : "Rutina guardada"}
                </p>
                <p className="mt-0.5 truncate font-semibold">
                  {suggested.name}
                </p>
                <MetaLine
                  className="mt-0.5"
                  items={[
                    routineStats.get(suggested.id)?.exerciseCount
                      ? `${routineStats.get(suggested.id)!.exerciseCount} ejercicios`
                      : null,
                    routineStats.get(suggested.id)?.typicalMinutes
                      ? `~${routineStats.get(suggested.id)!.typicalMinutes} min`
                      : null,
                    formatDays(suggested.days),
                  ]}
                />
              </div>
              <ChevronRightIcon className="shrink-0 text-faint" />
            </Link>
          )}

          {todayRoutine && !activeWorkout && (
            <form action={startWorkoutAction} className="mt-2 text-center">
              <SubmitButton variant="ghost" size="sm" pendingLabel="…">
                O entrenar libre
              </SubmitButton>
            </form>
          )}

          {/* Último entrenamiento */}
          {last && (
            <section className="mt-8">
              <SectionTitle
                action={
                  <Link
                    href="/historial"
                    className="text-[13px] text-faint transition-colors hover:text-muted"
                  >
                    Ver todo
                  </Link>
                }
              >
                Último entrenamiento
              </SectionTitle>
              <Link
                href={`/workout/${last.id}`}
                className="block rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-muted/40"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate font-semibold">
                    {lastRoutine?.name ?? "Entrenamiento libre"}
                  </p>
                  <p className="shrink-0 text-[13px] text-faint">
                    {new Date(last.startedAt).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                <MetaLine
                  className="mt-1"
                  items={[
                    `${last.exerciseCount} ejercicios`,
                    last.durationMinutes ? `${last.durationMinutes} min` : null,
                    `${last.volume.toLocaleString("es-AR")} kg`,
                  ]}
                />

                {summary.topSet?.exerciseName && (
                  <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                    <ArrowUpIcon
                      width={16}
                      height={16}
                      className="shrink-0 text-accent"
                    />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-muted">
                      {summary.topSet.exerciseName}
                    </span>
                    <span className="text-[15px] font-bold tabular-nums">
                      {summary.topSet.weight}
                      <span className="text-[13px] font-medium text-muted">
                        {" "}
                        kg
                      </span>
                      <span className="mx-1 text-faint">×</span>
                      {summary.topSet.reps ?? "—"}
                    </span>
                  </div>
                )}
              </Link>
            </section>
          )}
        </div>

        {/* Columna secundaria: en móvil va debajo, en desktop al costado */}
        <aside className="mt-8 lg:col-span-2 lg:mt-0">
          <SectionTitle>Tu actividad</SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            <Panel className="px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.1em] text-faint">
                Sesiones
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums">
                {summary.totalWorkouts}
              </p>
            </Panel>
            <Panel className="px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.1em] text-faint">
                Vol. 30d
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums">
                {Math.round(summary.volume30d / 1000)}
                <span className="text-sm font-medium text-muted">t</span>
              </p>
            </Panel>
            <Panel className="px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.1em] text-faint">
                Récords
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-accent">
                {records.length}
              </p>
            </Panel>
          </div>

          {summary.recentVolumes.length > 1 && (
            <Panel className="mt-3">
              <div className="mb-2 flex items-baseline justify-between">
                <p className="text-[11px] uppercase tracking-[0.1em] text-faint">
                  Volumen por sesión
                </p>
                <Badge tone="accent">últimas {summary.recentVolumes.length}</Badge>
              </div>
              <Sparkbars values={summary.recentVolumes} />
            </Panel>
          )}

          {records.length > 0 && (
            <Link
              href="/records"
              className="mt-3 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 transition-colors hover:border-muted/40"
            >
              <TrophyIcon className="shrink-0 text-accent" />
              <span className="flex-1 text-sm font-medium">Ver récords</span>
              <ChevronRightIcon className="shrink-0 text-faint" />
            </Link>
          )}
        </aside>
      </div>
    </main>
  );
}
