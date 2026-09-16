import { getCurrentProfile } from "@/lib/data/profiles";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "./sign-out-button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">
        Hola, {profile?.display_name || user.email}
      </h1>
      <p className="text-sm text-neutral-500">Sesión iniciada</p>
      <SignOutButton />
    </main>
  );
}
