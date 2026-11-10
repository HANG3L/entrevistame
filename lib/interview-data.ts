import "server-only";
import type { InterviewRow } from "@/lib/interview";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// RLS garantiza que cada usuario solo lee sus propias entrevistas.
export async function getInterview(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interviews")
    .select("id, job_title, level, plan, status, created_at")
    .eq("id", id)
    .maybeSingle<InterviewRow>();
  if (error) console.error("Error leyendo la entrevista:", error.message);
  return data;
}

export async function listInterviews() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interviews")
    .select("id, job_title, level, plan, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<InterviewRow[]>();
  if (error) console.error("Error listando entrevistas:", error.message);
  return data ?? [];
}
