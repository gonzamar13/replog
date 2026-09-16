import "server-only";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cache } from "react";

/**
 * supabase.auth.getUser() no decodifica el token localmente: le pregunta
 * al servidor de Supabase cada vez. Llamarlo desde cada función de datos
 * costaba 3 o 4 viajes de red por pantalla.
 *
 * cache() de React memoiza el resultado durante el render de un mismo
 * request, así que ahora es uno solo por página, sin importar cuántas
 * funciones lo necesiten.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

// Chequeo optimista de sesión para páginas — si no hay usuario, redirige a
// /login antes de renderizar nada. RLS sigue siendo la verdadera barrera de
// seguridad sobre los datos; esto es solo para no mostrar una pantalla
// vacía en vez de mandar a loguearse.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
