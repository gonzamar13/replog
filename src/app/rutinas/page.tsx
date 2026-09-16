import { requireUser } from "@/lib/auth";
import { listRoutinesGroupedByProgram } from "@/lib/data/routines";
import Link from "next/link";
import { createRoutineAction, createRoutineGroupAction } from "./actions";

export default async function RutinasPage() {
  await requireUser();
  const { groups, ungrouped } = await listRoutinesGroupedByProgram();

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Rutinas</h1>
        <Link href="/" className="text-sm text-neutral-500">
          Inicio
        </Link>
      </div>

      {groups.length === 0 && ungrouped.length === 0 && (
        <p className="text-sm text-neutral-500">
          Todavía no creaste ninguna rutina.
        </p>
      )}

      <div className="space-y-5">
        {groups.map(({ group, routines }) => (
          <section key={group.id}>
            <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
              {group.name}
            </h2>
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
              {routines.length === 0 && (
                <p className="text-xs text-neutral-400">
                  Sin rutinas todavía.
                </p>
              )}
            </ul>
          </section>
        ))}

        {ungrouped.length > 0 && (
          <section>
            <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
              Sin programa
            </h2>
            <ul className="space-y-2">
              {ungrouped.map((routine) => (
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
          </section>
        )}
      </div>

      <form action={createRoutineAction} className="mt-6 flex gap-2">
        <input
          type="text"
          name="name"
          required
          placeholder="Nombre de la rutina (ej. Pecho + Tríceps)"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        {groups.length > 0 && (
          <select
            name="groupId"
            defaultValue=""
            className="rounded-md border border-neutral-300 px-2 py-2 text-sm"
          >
            <option value="">Sin programa</option>
            {groups.map(({ group }) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        )}
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Crear
        </button>
      </form>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-neutral-500">
          Crear un programa nuevo
        </summary>
        <form
          action={createRoutineGroupAction}
          className="mt-2 space-y-2 rounded-lg border border-neutral-200 p-3"
        >
          <input
            type="text"
            name="name"
            required
            placeholder="Nombre del programa (ej. Trimestre 1 2026)"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <label className="flex-1 text-xs text-neutral-500">
              Desde
              <input
                type="date"
                name="startsOn"
                className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-2 text-sm"
              />
            </label>
            <label className="flex-1 text-xs text-neutral-500">
              Hasta
              <input
                type="date"
                name="endsOn"
                className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-2 text-sm"
              />
            </label>
          </div>
          <button
            type="submit"
            className="w-full rounded-md border border-neutral-300 py-2 text-sm font-medium"
          >
            Crear programa
          </button>
        </form>
      </details>
    </main>
  );
}
