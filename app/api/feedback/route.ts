import { NextResponse } from "next/server";
import { GeminiError, generateJson } from "@/lib/gemini";
import { QUESTION_TYPES, type Competency, type Improvement, type InterviewRow, type QuestionFeedback, type Turn, type Verdict } from "@/lib/interview";
import { FEEDBACK_SCHEMA, FEEDBACK_SYSTEM, feedbackPrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { groupByQuestion } from "@/lib/transcript";

// El modelo completo tarda ~20 s en evaluar toda la entrevista.
export const maxDuration = 60;

type FeedbackFromAI = {
  puntaje_general: number;
  veredicto: Verdict;
  resumen: string;
  competencias: Competency[];
  fortalezas: string[];
  mejoras: Improvement[];
  por_pregunta: QuestionFeedback[];
  proximos_pasos: string[];
};

const errorJson = (error: string, status: number) => NextResponse.json({ error }, { status });
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(Number(n) || 0)));

/** Genera (una sola vez) el feedback de una entrevista terminada. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return errorJson("No autorizado", 401);

  const body = (await request.json().catch(() => null)) as { interviewId?: unknown } | null;
  const interviewId = typeof body?.interviewId === "string" ? body.interviewId : "";

  const { data: interview } = await supabase
    .from("interviews")
    .select("id, job_title, level, plan, status, created_at")
    .eq("id", interviewId)
    .maybeSingle<InterviewRow>();
  if (!interview?.plan) return errorJson("Entrevista no encontrada", 404);
  if (interview.status !== "terminada") return errorJson("La entrevista todavía no termina.", 409);

  const { data: existing } = await supabase
    .from("feedback")
    .select("interview_id")
    .eq("interview_id", interview.id)
    .maybeSingle();
  if (existing) return NextResponse.json({ ok: true });

  const { data: turnRows } = await supabase
    .from("turns")
    .select("role, content, position, question_id, kind")
    .eq("interview_id", interview.id)
    .order("position");
  const blocks = groupByQuestion(interview.plan, (turnRows ?? []) as Turn[]);
  if (!blocks.some((b) => b.turns.some((t) => t.role === "usuario"))) {
    return errorJson("No hay respuestas para evaluar.", 422);
  }

  const plan = interview.plan;
  let ai: FeedbackFromAI;
  try {
    ai = await generateJson<FeedbackFromAI>(
      feedbackPrompt({
        puesto: plan.puesto,
        nivel: plan.nivel,
        resumenCandidato: plan.resumen_candidato,
        bloques: blocks.map(({ question, turns }) => ({
          id: question.id,
          tipo: QUESTION_TYPES[question.tipo] ?? question.tipo,
          pregunta: question.pregunta,
          objetivo: question.objetivo,
          senales: question.senales,
          dialogo: turns.map((t) => ({ role: t.role, content: t.content })),
        })),
      }),
      { system: FEEDBACK_SYSTEM, schema: FEEDBACK_SCHEMA, temperature: 0.4 },
    );
  } catch (e) {
    if (!(e instanceof GeminiError)) console.error("Error preparando el feedback:", e);
    return errorJson(e instanceof GeminiError ? e.userMessage : "No se pudo generar el feedback.", 502);
  }

  const score = clamp(ai.puntaje_general, 0, 100);
  const verdict: Verdict = score >= 80 ? "listo" : score >= 60 ? "casi" : "practicar";
  const validIds = new Set(blocks.map((b) => b.question.id));

  const { error } = await supabase.from("feedback").upsert(
    {
      interview_id: interview.id,
      overall_score: score,
      verdict,
      summary: ai.resumen,
      competencies: (ai.competencias ?? []).map((c) => ({ ...c, puntaje: clamp(c.puntaje, 1, 10) })),
      strengths: ai.fortalezas ?? [],
      improvements: ai.mejoras ?? [],
      per_question: (ai.por_pregunta ?? [])
        .filter((q) => validIds.has(q.question_id))
        .map((q) => ({ ...q, puntaje: clamp(q.puntaje, 1, 10) })),
      next_steps: ai.proximos_pasos ?? [],
    },
    { onConflict: "interview_id", ignoreDuplicates: true },
  );
  if (error) {
    console.error("Error guardando el feedback:", error.message);
    return errorJson("No se pudo guardar el feedback. ¿Ejecutaste supabase/migrations/003_feedback_report.sql?", 500);
  }

  return NextResponse.json({ ok: true });
}
