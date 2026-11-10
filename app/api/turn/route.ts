import { NextResponse } from "next/server";
import { GeminiError, generateJson } from "@/lib/gemini";
import type { InterviewRow, Turn, TurnKind, TurnResponse } from "@/lib/interview";
import { TURN_SCHEMA, TURN_SYSTEM, turnPrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";

const MAX_FOLLOWUPS = 2; // repreguntas + aclaraciones por pregunta
const MAX_ANSWER_CHARS = 4000;

type Decision = { accion: "repreguntar" | "aclarar" | "siguiente"; reaccion: string; texto: string };

const clean = (s: string | undefined) => (s ?? "").replace(/[*_#`]/g, "").replace(/\s+/g, " ").trim();
const errorJson = (error: string, status: number) => NextResponse.json({ error }, { status });

/**
 * Avanza la entrevista un turno.
 * - Sin respuesta y sin turnos previos: empieza (saludo + primera pregunta).
 * - Sin respuesta y con turnos: devuelve lo último que dijo la IA (para retomar).
 * - Con respuesta: la guarda y decide si repreguntar, aclarar o pasar a la siguiente.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return errorJson("No autorizado", 401);

  const body = (await request.json().catch(() => null)) as { interviewId?: unknown; answer?: unknown } | null;
  const interviewId = typeof body?.interviewId === "string" ? body.interviewId : "";
  const answer = typeof body?.answer === "string" ? body.answer.trim().slice(0, MAX_ANSWER_CHARS) : "";

  // RLS: solo encuentra entrevistas del usuario con sesión.
  const { data: interview } = await supabase
    .from("interviews")
    .select("id, job_title, level, plan, status, created_at")
    .eq("id", interviewId)
    .maybeSingle<InterviewRow>();
  if (!interview?.plan) return errorJson("Entrevista no encontrada", 404);

  const plan = interview.plan;
  const total = plan.preguntas.length;

  const { data: turnRows, error: turnsError } = await supabase
    .from("turns")
    .select("role, content, position, question_id, kind")
    .eq("interview_id", interview.id)
    .order("position");
  if (turnsError) {
    console.error("Error leyendo turnos:", turnsError.message);
    return errorJson("No se pudo leer la entrevista. ¿Ejecutaste supabase/migrations/002_turn_meta.sql?", 500);
  }
  const turns = (turnRows ?? []) as Turn[];

  const numberOf = (questionId: number | null) =>
    Math.max(0, plan.preguntas.findIndex((q) => q.id === questionId)) + 1;

  async function addTurns(rows: Omit<Turn, "position">[]) {
    const { error } = await supabase.from("turns").insert(
      rows.map((r, i) => ({ ...r, interview_id: interview!.id, position: turns.length + i })),
    );
    if (error) throw new Error(error.message);
  }

  try {
    // --- Entrevista terminada ---
    if (interview.status === "terminada") {
      const last = turns.findLast((t) => t.role === "ia");
      return NextResponse.json<TurnResponse>({
        say: last?.content ?? "La entrevista ya terminó.",
        kind: "despedida",
        questionNumber: total,
        totalQuestions: total,
        done: true,
      });
    }

    // --- Inicio ---
    if (turns.length === 0) {
      const first = plan.preguntas[0];
      await addTurns([
        { role: "ia", content: plan.saludo, question_id: null, kind: "saludo" },
        { role: "ia", content: first.pregunta, question_id: first.id, kind: "pregunta" },
      ]);
      await supabase.from("interviews").update({ status: "en_curso" }).eq("id", interview.id);
      return NextResponse.json<TurnResponse>({
        say: `${plan.saludo} ${first.pregunta}`,
        kind: "pregunta",
        questionNumber: 1,
        totalQuestions: total,
        done: false,
      });
    }

    const lastAi = turns.findLast((t) => t.role === "ia")!;

    // --- Retomar (recargó la página) ---
    if (!answer) {
      return NextResponse.json<TurnResponse>({
        say: lastAi.content,
        kind: lastAi.kind ?? "pregunta",
        questionNumber: numberOf(lastAi.question_id),
        totalQuestions: total,
        done: false,
      });
    }

    // --- Respuesta del candidato ---
    const qIndex = Math.max(0, plan.preguntas.findIndex((q) => q.id === lastAi.question_id));
    const question = plan.preguntas[qIndex];

    const conversation = [
      ...turns.filter((t) => t.question_id === question.id),
      { role: "usuario" as const, content: answer },
    ];
    const followups = turns.filter(
      (t) => t.role === "ia" && t.question_id === question.id && (t.kind === "repregunta" || t.kind === "aclaracion"),
    ).length;

    let decision: Decision = { accion: "siguiente", reaccion: "Gracias.", texto: "" };
    try {
      decision = await generateJson<Decision>(
        turnPrompt({
          puesto: plan.puesto,
          nivel: plan.nivel,
          pregunta: question.pregunta,
          objetivo: question.objetivo,
          senales: question.senales,
          conversacion: conversation,
          repreguntasHechas: followups,
          maxRepreguntas: MAX_FOLLOWUPS,
        }),
        { system: TURN_SYSTEM, schema: TURN_SCHEMA, fast: true, temperature: 0.6 },
      );
    } catch (e) {
      // Si la IA falla, la entrevista sigue con la siguiente pregunta del plan.
      if (!(e instanceof GeminiError)) throw e;
    }

    const reaction = clean(decision.reaccion);
    const followupText = clean(decision.texto);
    const userTurn = { role: "usuario" as const, content: answer, question_id: question.id, kind: "respuesta" as const };

    // Repregunta o aclaración
    if (decision.accion !== "siguiente" && followupText && followups < MAX_FOLLOWUPS) {
      const kind: TurnKind = decision.accion === "aclarar" ? "aclaracion" : "repregunta";
      const say = `${reaction} ${followupText}`.trim();
      await addTurns([userTurn, { role: "ia", content: say, question_id: question.id, kind }]);
      return NextResponse.json<TurnResponse>({
        say,
        kind,
        questionNumber: qIndex + 1,
        totalQuestions: total,
        done: false,
      });
    }

    // Siguiente pregunta
    const next = plan.preguntas[qIndex + 1];
    if (next) {
      const say = `${reaction} ${next.pregunta}`.trim();
      await addTurns([userTurn, { role: "ia", content: say, question_id: next.id, kind: "pregunta" }]);
      return NextResponse.json<TurnResponse>({
        say,
        kind: "pregunta",
        questionNumber: qIndex + 2,
        totalQuestions: total,
        done: false,
      });
    }

    // Fin de la entrevista
    const goodbye = `${reaction} Con esto terminamos la entrevista. Muchas gracias por tu tiempo. En unos momentos verás tu retroalimentación para seguir mejorando.`.trim();
    await addTurns([userTurn, { role: "ia", content: goodbye, question_id: null, kind: "despedida" }]);
    await supabase.from("interviews").update({ status: "terminada" }).eq("id", interview.id);
    return NextResponse.json<TurnResponse>({
      say: goodbye,
      kind: "despedida",
      questionNumber: total,
      totalQuestions: total,
      done: true,
    });
  } catch (e) {
    console.error("Error en /api/turn:", e);
    return errorJson("No se pudo guardar el turno. Intenta de nuevo.", 500);
  }
}
