import { HistoryIcon } from "@/components/icons";
import { EmptyState, MetaLine, Page, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { listRoutines } from "@/lib/data/routines";
import { listFinishedWorkoutsWithSummary } from "@/lib/data/workouts";
import Link from "next/link";

export default async function HistorialPage() {
  await requireUser();
  const [workouts, routines] = await Promise.all([
    listFinishedWorkoutsWithSummary(),
    listRoutines(),
  ]);

  const routineById = new Map(routines.map((r) => [r.id, r]));

  return (
    <Page>
      <PageHeader
        title="Historial"
        subtitle={
          workouts.length > 0
            ? `${workouts.length} ${workouts.length === 1 ? "sesión" : "sesiones"} registradas`
            : undefined
        }
      />

      {workouts.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon width={28} height={28} />}
          title="Todavía no terminaste ningún entrenamiento"
          description="Cuando finalices una sesión, va a quedar acá con su volumen y duración."
        />
      ) : (
        <ul className="space-y-2">
          {workouts.map((w) => {
            const routine = w.routine_id ? routineById.get(w.routine_id) : null;
            const date = new Date(w.started_at);

            return (
              <li key={w.id}>
                <Link
                  href={`/workout/${w.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-line bg-surface px-4 py-3 transition-colors hover:border-muted/40"
                >
                  {/* La fecha como ancla visual, no como columna de tabla */}
                  <div className="w-11 shrink-0 text-center">
                    <p className="text-lg font-bold leading-none tabular-nums">
                      {date.getDate()}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
                      {date.toLocaleDateString("es-AR", { month: "short" })}
                    </p>
                  </div>

                  <div className="min-w-0 flex-1 border-l border-line pl-4">
                    <p className="truncate font-semibold">
                      {routine?.name ?? "Entrenamiento libre"}
                    </p>
                    <MetaLine
                      className="mt-0.5"
                      items={[
                        w.durationMinutes ? `${w.durationMinutes} min` : null,
                        `${w.exerciseCount} ejercicios`,
                        `${w.setCount} series`,
                      ]}
                    />
                  </div>

                  <p className="shrink-0 text-right text-[15px] font-bold tabular-nums">
                    {w.volume.toLocaleString("es-AR")}
                    <span className="text-[13px] font-medium text-muted"> kg</span>
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
