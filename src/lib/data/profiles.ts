import "server-only";

import { createClient } from "@/lib/supabase/server";

// Capa de datos ("services" en otros stacks): funciones de servidor que
// centralizan cómo se leen/escriben las tablas, para que las páginas y
// componentes no llamen a Supabase directo. Cada dominio (rutinas,
// entrenamientos, etc.) va a sumar su propio archivo acá a medida que
// se construye esa pantalla — no se anticipan funciones que todavía no
// tienen una pantalla real detrás.

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, unit_pref")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function updateProfile(input: {
  displayName: string | null;
  unitPref: "kg" | "lb";
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: input.displayName, unit_pref: input.unitPref })
    .eq("id", user.id);

  if (error) throw error;
}
