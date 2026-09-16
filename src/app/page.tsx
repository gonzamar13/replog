import { requireUser } from "@/lib/auth";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getActiveWorkout } from "@/lib/data/workouts";
import Link from "next/link";
import { SignOutButton } from "./sign-out-button";
import { startWorkoutAction } from "./workout/actions";

export default async function Home() {
  const user = await requireUser();

  const [profile, activeWorkout] = await Promise.all([
    getCurrentProfile(),
    getActiveWorkout(),
  ]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-2xl font-semibold">
        Hola, {profile?.display_name || user.email}
      </h1>

      {activeWorkout ? (
        <Link
          href={`/workout/${activeWorkout.id}`}
          className="w-full max-w-xs rounded-lg bg-neutral-900 py-4 text-base font-medium text-white"
        >
          Continuar entrenamiento
        </Link>
      ) : (
        <form action={startWorkoutAction} className="w-full max-w-xs">
          <button
            type="submit"
            className="w-full rounded-lg bg-neutral-900 py-4 text-base font-medium text-white"
          >
            🏋️ Entrenar
          </button>
        </form>
      )}

      <nav className="flex w-full max-w-xs justify-center gap-6 text-sm text-neutral-500">
        <Link href="/rutinas">📚 Rutinas</Link>
        <Link href="/historial">📈 Historial</Link>
      </nav>

      <SignOutButton />
    </main>
  );
}
