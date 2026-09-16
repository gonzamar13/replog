import { TrophyIcon } from "@/components/icons";
import { EmptyState, MetaLine, Page, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { listExercises } from "@/lib/data/exercises";
import { getPersonalRecords } from "@/lib/data/progress";
import Link from "next/link";

export default async function RecordsPage() {
  await requireUser();
  const [records, exercises] = await Promise.all([
    getPersonalRecords(),
    listExercises(),
  ]);

  const exerciseById = new Map(exercises.map((e) => [e.id, e]));
  const sorted = records
    .map((r) => ({ ...r, exercise: exerciseById.get(r.exerciseId) }))
    .filter((r) => r.exercise)
    .sort((a, b) => b.weight - a.weight);

  return (
    <Page>
      <PageHeader
        title="Récords"
        back={{ href: "/progreso", label: "Progreso" }}
        subtitle="Tu mejor serie de cada ejercicio."
      />

      {sorted.length === 0 ? (
        <EmptyState
          icon={<TrophyIcon width={28} height={28} />}
          title="Sin récords todavía"
          description="Registrá series con peso y tus máximos aparecen acá solos."
        />
      ) : (
        <ul className="space-y-2">
          {sorted.map((r) => (
            <li key={r.exerciseId}>
              <Link
                href={`/progreso?exercise=${r.exerciseId}`}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 transition-colors hover:border-accent/30"
              >
                <TrophyIcon className="shrink-0 text-accent" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{r.exercise!.name}</p>
                  <MetaLine
                    className="mt-0.5"
                    items={[
                      r.exercise!.muscle_group,
                      new Date(r.date).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }),
                    ]}
                  />
                </div>
                <p className="shrink-0 text-lg font-bold tabular-nums text-accent">
                  {r.weight}
                  <span className="text-[13px] font-medium"> kg</span>
                  <span className="mx-1 text-accent/50">×</span>
                  {r.reps ?? "—"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
