"use server";

import { redirect } from "next/navigation";
import { GeminiError, generateJson } from "@/lib/gemini";
import { LENGTHS, type InterviewPlan, type PlannedQuestion } from "@/lib/interview";
import { LEVELS } from "@/lib/levels";
import { PLAN_SCHEMA, PLAN_SYSTEM, planPrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";

export type NewInterviewState = { error?: string };

type PlanFromAI = Omit<InterviewPlan, "puesto" | "nivel" | "oferta" | "preguntas"> & {
  preguntas: Omit<PlannedQuestion, "id">[];
};

export async function createInterview(
  _prev: NewInterviewState,
  formData: FormData,
): Promise<NewInterviewState> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const puesto = String(formData.get("puesto") ?? "").trim().slice(0, 120);
  const oferta = String(formData.get("oferta") ?? "").trim().slice(0, 6000) || null;
  const levelValue = String(formData.get("level") ?? "");
  const level = LEVELS.find((l) => l.value === levelValue);
  const length = LENGTHS.find((l) => l.value === formData.get("length")) ?? LENGTHS[1];

  if (puesto.length < 3) return { error: "Escribe el puesto al que quieres aplicar." };
  if (!level) return { error: "Elige tu nivel de experiencia." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, cv_text")
    .eq("id", user.id)
    .maybeSingle<{ full_name: string | null; cv_text: string | null }>();

  if (!profile?.cv_text) return { error: "Primero sube tu CV en la página de Perfil." };

  let ai: PlanFromAI;
  try {
    ai = await generateJson<PlanFromAI>(
      planPrompt({
        puesto,
        nivel: level.label,
        oferta,
        cv: profile.cv_text,
        totalPreguntas: length.questions,
        nombre: profile.full_name ?? "Candidato",
      }),
      { system: PLAN_SYSTEM, schema: PLAN_SCHEMA, temperature: 0.7 },
    );
  } catch (e) {
    return { error: e instanceof GeminiError ? e.userMessage : "No se pudo preparar la entrevista." };
  }

  if (!Array.isArray(ai.preguntas) || ai.preguntas.length === 0) {
    return { error: "La IA no devolvió preguntas. Intenta de nuevo." };
  }

  const plan: InterviewPlan = {
    puesto,
    nivel: level.label,
    oferta,
    entrevistador: ai.entrevistador || "Andrea",
    saludo: ai.saludo,
    resumen_candidato: ai.resumen_candidato,
    fortalezas: ai.fortalezas ?? [],
    brechas: ai.brechas ?? [],
    preguntas: ai.preguntas.slice(0, length.questions).map((q, i) => ({ ...q, id: i + 1 })),
  };

  const { data: row, error } = await supabase
    .from("interviews")
    .insert({ user_id: user.id, job_title: puesto, level: level.value, plan })
    .select("id")
    .single();

  if (error || !row) {
    console.error("Error guardando la entrevista:", error?.message);
    return { error: "No se pudo guardar la entrevista. Intenta de nuevo." };
  }

  redirect(`/entrevista/${row.id}`);
}
