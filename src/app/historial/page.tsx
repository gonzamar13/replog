import { requireUser } from "@/lib/auth";
import { listFinishedWorkouts } from "@/lib/data/workouts";
import Link from "next/link";

function formatDuration(startedAt: string, endedAt: string) {
  const minutes = Math.round(
    (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000,
  );
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
}

export default async function HistorialPage() {
  await requireUser();
  const workouts = await listFinishedWorkouts();

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Historial</h1>
        <Link href="/" className="text-sm text-neutral-500">
          Inicio
        </Link>
      </div>

      {workouts.length === 0 && (
        <p className="text-sm text-neutral-500">
          Todavía no terminaste ningún entrenamiento.
        </p>
      )}

      <ul className="space-y-2">
        {workouts.map((workout) => (
          <li key={workout.id}>
            <Link
              href={`/workout/${workout.id}`}
              className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3"
            >
              <span className="text-sm font-medium">
                {new Date(workout.started_at).toLocaleDateString("es-AR", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
              <span className="text-xs text-neutral-500">
                {workout.ended_at
                  ? formatDuration(workout.started_at, workout.ended_at)
                  : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
