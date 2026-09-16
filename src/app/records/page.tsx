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
    .sort((a, b) => a.exercise!.name.localeCompare(b.exercise!.name));

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Récords</h1>
        <Link href="/" className="text-sm text-neutral-500">
          Inicio
        </Link>
      </div>

      {sorted.length === 0 && (
        <p className="text-sm text-neutral-500">
          Todavía no hay series registradas con peso.
        </p>
      )}

      <ul className="space-y-1">
        {sorted.map((r) => (
          <li
            key={r.exerciseId}
            className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm"
          >
            <span>{r.exercise!.name}</span>
            <span className="font-medium">
              {r.weight}kg × {r.reps ?? "—"}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
