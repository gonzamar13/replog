import { requireUser } from "@/lib/auth";
import { listExercises } from "@/lib/data/exercises";
import Link from "next/link";
import { createExerciseAction } from "./actions";

export default async function EjerciciosPage() {
  await requireUser();
  const exercises = await listExercises();

  const groups = new Map<string, typeof exercises>();
  for (const exercise of exercises) {
    const key = exercise.muscle_group ?? "Otros";
    const list = groups.get(key) ?? [];
    list.push(exercise);
    groups.set(key, list);
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Ejercicios</h1>
        <Link href="/" className="text-sm text-neutral-500">
          Inicio
        </Link>
      </div>

      <div className="space-y-4">
        {Array.from(groups.entries()).map(([muscleGroup, items]) => (
          <section key={muscleGroup}>
            <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
              {muscleGroup}
            </h2>
            <ul className="space-y-1">
              {items.map((exercise) => (
                <li
                  key={exercise.id}
                  className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm"
                >
                  {exercise.name}
                  {exercise.is_custom && (
                    <span className="text-xs text-neutral-400">tuyo</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <form
        action={createExerciseAction}
        className="mt-6 space-y-2 rounded-lg border border-neutral-200 p-3"
      >
        <p className="text-sm font-medium">Crear ejercicio</p>
        <input
          type="text"
          name="name"
          required
          placeholder="Nombre (ej. Press Arnold)"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          type="text"
          name="muscleGroup"
          placeholder="Grupo muscular (opcional)"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="w-full rounded-md border border-neutral-300 py-2 text-sm font-medium"
        >
          Agregar
        </button>
      </form>
    </main>
  );
}
