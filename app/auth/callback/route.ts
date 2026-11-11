import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google -> Supabase -> aquí. Cambiamos el código por una sesión y entramos a la app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/dashboard";
  // Solo rutas internas, para evitar redirecciones a otros sitios.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/?error=login`);
}
