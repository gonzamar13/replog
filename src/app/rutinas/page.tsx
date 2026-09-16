import { requireUser } from "@/lib/auth";
import { listRoutines } from "@/lib/data/routines";
import Link from "next/link";
import { createRoutineAction } from "./actions";

export default async function RutinasPage() {
  await requireUser();
  const routines = await listRoutines();

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Rutinas</h1>
        <Link href="/" className="text-sm text-neutral-500">
          Inicio
        </Link>
      </div>

      {routines.length === 0 && (
        <p className="text-sm text-neutral-500">
          Todavía no creaste ninguna rutina.
        </p>
      )}

      <ul className="space-y-2">
        {routines.map((routine) => (
          <li key={routine.id}>
            <Link
              href={`/rutinas/${routine.id}`}
              className="block rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium"
            >
              {routine.name}
            </Link>
          </li>
        ))}
      </ul>

      <form action={createRoutineAction} className="mt-4 flex gap-2">
        <input
          type="text"
          name="name"
          required
          placeholder="Nombre de la rutina (ej. Pecho + Tríceps)"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Crear
        </button>
      </form>
    </main>
  );
}
