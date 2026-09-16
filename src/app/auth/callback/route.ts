import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Punto de retorno del login con Google (y de los links mágicos por email).
// Supabase redirige acá con un "code" en la URL que hay que canjear por una sesión.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
