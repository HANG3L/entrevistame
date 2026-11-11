import "server-only";
import type { FeedbackRow, InterviewRow, Turn } from "@/lib/interview";
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

export type InterviewListItem = InterviewRow & { feedback: { overall_score: number } | null };

export async function listInterviews() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interviews")
    .select("id, job_title, level, plan, status, created_at, feedback(overall_score)")
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<InterviewListItem[]>();
  if (error) console.error("Error listando entrevistas:", error.message);
  return data ?? [];
}

export async function getTurns(interviewId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("turns")
    .select("role, content, position, question_id, kind")
    .eq("interview_id", interviewId)
    .order("position")
    .returns<Turn[]>();
  return data ?? [];
}

export async function getFeedback(interviewId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .eq("interview_id", interviewId)
    .maybeSingle<FeedbackRow>();
  if (error) console.error("Error leyendo el feedback:", error.message);
  return data;
}
