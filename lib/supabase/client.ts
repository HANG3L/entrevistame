import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/env";

// Cliente de Supabase para componentes que corren en el navegador.
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
