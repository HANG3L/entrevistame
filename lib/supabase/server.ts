import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/env";

// Cliente de Supabase para Server Components, Route Handlers y Server Functions.
export async function createClient() {
  // Supabase usa Date.now() para revisar si la sesión expiró. Con connection()
  // Next sabe que esto se calcula en cada petición y no al prerenderizar.
  await connection();
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Llamado desde un Server Component: no se pueden escribir cookies.
          // No pasa nada porque proxy.ts ya refresca la sesión.
        }
      },
    },
  });
}

// Devuelve el usuario con sesión o null.
export async function getUser() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
