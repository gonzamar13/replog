import { requireUser } from "@/lib/auth";
import { getCurrentProfile } from "@/lib/data/profiles";
import Link from "next/link";
import { updateProfileAction } from "./actions";

export default async function PerfilPage() {
  const user = await requireUser();
  const profile = await getCurrentProfile();

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Perfil</h1>
        <Link href="/" className="text-sm text-neutral-500">
          Inicio
        </Link>
      </div>

      <p className="mb-4 text-sm text-neutral-500">{user.email}</p>

      <form action={updateProfileAction} className="space-y-3">
        <label className="block text-xs text-neutral-500">
          Nombre
          <input
            type="text"
            name="displayName"
            defaultValue={profile?.display_name ?? ""}
            placeholder="Cómo querés que te salude la app"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block text-xs text-neutral-500">
          Unidad de peso
          <select
            name="unitPref"
            defaultValue={profile?.unit_pref ?? "kg"}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="kg">Kilogramos (kg)</option>
            <option value="lb">Libras (lb)</option>
          </select>
        </label>

        <button
          type="submit"
          className="w-full rounded-lg bg-neutral-900 py-3 text-sm font-medium text-white"
        >
          Guardar
        </button>
      </form>
    </main>
  );
}
