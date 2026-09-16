import { ProgressIcon, TrophyIcon } from "@/components/icons";
import {
  Badge,
  EmptyState,
  MetaLine,
  Page,
  PageHeader,
  Panel,
  SectionTitle,
  StatTile,
} from "@/components/ui";
import { ExercisePicker } from "@/components/exercise-picker";
import { LineChart } from "@/components/ui/chart";
import { requireUser } from "@/lib/auth";
import { listExercises } from "@/lib/data/exercises";
import { getExerciseHistory } from "@/lib/data/progress";
import Link from "next/link";

export default async function ProgresoPage({
  searchParams,
}: {
  searchParams: Promise<{ exercise?: string }>;
}) {
  await requireUser();
  const { exercise: exerciseId } = await searchParams;
  const exercises = await listExercises();
  const history = exerciseId ? await getExerciseHistory(exerciseId) : [];

  const exercise = exerciseId
    ? exercises.find((e) => e.id === exerciseId)
    : null;

  const best = history.reduce(
    (max, h) => (h.maxWeight > max ? h.maxWeight : max),
    0,
  );
  const latest = history[history.length - 1] ?? null;
  const first = history[0] ?? null;
  const delta = latest && first ? latest.maxWeight - first.maxWeight : 0;

  return (
    <Page>
      <PageHeader
        title="Progreso"
        subtitle="Elegí un ejercicio para ver su evolución."
        action={
          <Link
            href="/records"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-[13px] font-medium text-muted transition-colors hover:text-ink"
          >
            <TrophyIcon width={16} height={16} />
            Récords
          </Link>
        }
      />

      <div className="mb-6">
        <ExercisePicker
          exercises={exercises}
          method="get"
          submitName="exercise"
          mode="select"
        />
      </div>

      {!exerciseId && (
        <EmptyState
          icon={<ProgressIcon width={28} height={28} />}
          title="Elegí un ejercicio"
          description="Vas a ver cómo evolucionó el peso sesión a sesión."
        />
      )}

      {exerciseId && history.length === 0 && (
        <EmptyState
          icon={<ProgressIcon width={28} height={28} />}
          title="Sin datos todavía"
          description="Este ejercicio no aparece en ninguna sesión terminada."
        />
      )}

      {history.length > 0 && exercise && (
        <>
          <div className="mb-5 flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">
              {exercise.name}
            </h2>
            {delta !== 0 && (
              <Badge tone={delta > 0 ? "accent" : "neutral"}>
                {delta > 0 ? "+" : ""}
                {delta} kg
              </Badge>
            )}
          </div>

          {/* Una sola gráfica principal: peso máximo por sesión */}
          <Panel>
            <p className="mb-1 text-[11px] uppercase tracking-[0.1em] text-faint">
              Peso máximo por sesión
            </p>
            <LineChart
              unit="kg"
              points={history.map((h) => ({
                label: new Date(h.date).toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "short",
                }),
                value: h.maxWeight,
              }))}
            />
          </Panel>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <StatTile label="Máximo" value={best} unit="kg" accent />
            <StatTile
              label="1RM est."
              value={latest?.estimated1RM ?? "—"}
              unit={latest?.estimated1RM ? "kg" : undefined}
            />
            <StatTile label="Sesiones" value={history.length} />
          </div>

          <section className="mt-8">
            <SectionTitle>Sesión a sesión</SectionTitle>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {[...history].reverse().map((h) => (
                <li key={h.workoutId}>
                  <Link
                    href={`/workout/${h.workoutId}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-elevated"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {new Date(h.date).toLocaleDateString("es-AR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      <MetaLine
                        className="mt-0.5"
                        items={[
                          `${h.setCount} series`,
                          `${h.volume.toLocaleString("es-AR")} kg vol.`,
                        ]}
                      />
                    </div>
                    <p className="shrink-0 text-[15px] font-bold tabular-nums">
                      {h.maxWeight}
                      <span className="text-[13px] font-medium text-muted">
                        {" "}
                        kg
                      </span>
                      {h.bestReps && (
                        <>
                          <span className="mx-1 text-faint">×</span>
                          {h.bestReps}
                        </>
                      )}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </Page>
  );
}
