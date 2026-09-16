import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Punto de retorno del login con Google (y de los links mágicos por email).
// Supabase redirige acá con un "code" en la URL que hay que canjear por una sesión.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Detrás del proxy de Vercel, request.url apunta al host interno del
  // contenedor: si redirigiéramos a ese origin, el login en producción
  // terminaría en una URL que el navegador no puede resolver.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";
  const baseUrl =
    isLocal || !forwardedHost ? origin : `https://${forwardedHost}`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${baseUrl}/login?error=auth`);
}
