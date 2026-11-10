import "server-only";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";

// Devuelve el usuario o una respuesta 401 lista para retornar.
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }
  return { user, error: null };
}
