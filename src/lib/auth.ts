import "server-only";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Chequeo optimista de sesión para páginas — si no hay usuario, redirige a
// /login antes de renderizar nada. RLS sigue siendo la verdadera barrera de
// seguridad sobre los datos; esto es solo para no mostrar una pantalla
// vacía en vez de mandar a loguearse.
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return user;
}
