import type { InterviewPlan, PlannedQuestion, Turn } from "@/lib/interview";

export type QuestionBlock = { question: PlannedQuestion; turns: Turn[] };

/** Agrupa los turnos por pregunta del plan (sin saludo ni despedida). */
export function groupByQuestion(plan: InterviewPlan, turns: Turn[]): QuestionBlock[] {
  return plan.preguntas
    .map((question) => ({ question, turns: turns.filter((t) => t.question_id === question.id) }))
    .filter((b) => b.turns.length > 0);
}

// Muletillas frecuentes en español hablado.
const FILLERS = ["eh", "em", "este", "o sea", "pues", "bueno", "entonces", "como que", "digamos", "básicamente", "tipo"];

export type SpeechStats = {
  answers: number;
  totalWords: number;
  avgWords: number;
  fillers: { word: string; count: number }[];
  fillerTotal: number;
};

/** Estadísticas simples de las respuestas del candidato. */
export function speechStats(turns: Turn[]): SpeechStats {
  const answers = turns.filter((t) => t.role === "usuario").map((t) => t.content.toLowerCase());
  const totalWords = answers.reduce((n, a) => n + a.split(/\s+/).filter(Boolean).length, 0);

  const fillers = FILLERS.map((word) => {
    const re = new RegExp(`(?<![\\p{L}])${word}(?![\\p{L}])`, "gu");
    return { word, count: answers.reduce((n, a) => n + (a.match(re)?.length ?? 0), 0) };
  })
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    answers: answers.length,
    totalWords,
    avgWords: answers.length ? Math.round(totalWords / answers.length) : 0,
    fillers,
    fillerTotal: fillers.reduce((n, f) => n + f.count, 0),
  };
}
