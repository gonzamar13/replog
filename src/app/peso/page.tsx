import { requireUser } from "@/lib/auth";
import { listBodyWeightLogs } from "@/lib/data/body-weight";
import { getCurrentProfile } from "@/lib/data/profiles";
import Link from "next/link";
import { createBodyWeightLogAction } from "./actions";

export default async function PesoPage() {
  await requireUser();
  const [logs, profile] = await Promise.all([
    listBodyWeightLogs(),
    getCurrentProfile(),
  ]);
  const unit = profile?.unit_pref ?? "kg";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Peso corporal</h1>
        <Link href="/" className="text-sm text-neutral-500">
          Inicio
        </Link>
      </div>

      <form action={createBodyWeightLogAction} className="mb-6 flex gap-2">
        <input
          type="number"
          name="weight"
          step="0.1"
          required
          placeholder={`Peso (${unit})`}
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          type="date"
          name="loggedAt"
          defaultValue={today}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Guardar
        </button>
      </form>

      {logs.length === 0 && (
        <p className="text-sm text-neutral-500">
          Todavía no registraste tu peso.
        </p>
      )}

      <ul className="space-y-1">
        {logs.map((log) => (
          <li
            key={log.id}
            className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm"
          >
            <span>
              {new Date(`${log.logged_at}T00:00:00`).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span className="font-medium">
              {log.weight} {unit}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
