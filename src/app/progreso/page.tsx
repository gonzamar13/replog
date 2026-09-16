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

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Progreso</h1>
        <Link href="/" className="text-sm text-neutral-500">
          Inicio
        </Link>
      </div>

      <form method="get" className="mb-4 flex gap-2">
        <select
          name="exercise"
          defaultValue={exerciseId ?? ""}
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Elegir ejercicio…
          </option>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.muscle_group ? `${ex.muscle_group} — ` : ""}
              {ex.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium"
        >
          Ver
        </button>
      </form>

      {exerciseId && history.length === 0 && (
        <p className="text-sm text-neutral-500">
          Todavía no hay sesiones finalizadas con este ejercicio.
        </p>
      )}

      {history.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-400">
                <th className="py-1 font-medium">Fecha</th>
                <th className="py-1 font-medium">Peso máx.</th>
                <th className="py-1 font-medium">Volumen</th>
                <th className="py-1 font-medium">Series</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.workoutId} className="border-t border-neutral-100">
                  <td className="py-1.5">
                    {new Date(h.date).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="py-1.5">{h.maxWeight}kg</td>
                  <td className="py-1.5">{h.volume}kg</td>
                  <td className="py-1.5">{h.setCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
