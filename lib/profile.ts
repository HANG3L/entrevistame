import "server-only";
import type { Level } from "@/lib/levels";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  level: Level | null;
  cv_text: string | null;
  cv_path: string | null;
  updated_at: string;
};

// Perfil del usuario con sesión (o null si no hay sesión o aún no existe la fila).
export async function getProfile() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { user: null, profile: null };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, level, cv_text, cv_path, updated_at")
    .eq("id", auth.user.id)
    .maybeSingle<Profile>();

  if (error) console.error("Error leyendo el perfil:", error.message);
  return { user: auth.user, profile };
}
