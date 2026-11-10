// Tipos de la entrevista (se usan en el servidor y en el navegador).

export const QUESTION_TYPES = {
  apertura: "Apertura",
  tecnica: "Técnica",
  comportamiento: "Comportamiento",
  situacional: "Situacional",
  cierre: "Cierre",
} as const;

export type QuestionType = keyof typeof QUESTION_TYPES;

export type PlannedQuestion = {
  id: number;
  tipo: QuestionType;
  pregunta: string; // Lo que la IA dirá en voz alta
  objetivo: string; // Qué quiere evaluar con la pregunta
  senales: string[]; // Qué esperaría escuchar en una buena respuesta
};

export type InterviewPlan = {
  puesto: string;
  nivel: string;
  oferta: string | null;
  entrevistador: string; // Nombre del entrevistador virtual
  saludo: string;
  resumen_candidato: string;
  fortalezas: string[];
  brechas: string[];
  preguntas: PlannedQuestion[];
};

export const LENGTHS = [
  { value: "corta", label: "Corta", questions: 4, hint: "~10 min" },
  { value: "normal", label: "Normal", questions: 6, hint: "~15 min" },
  { value: "larga", label: "Larga", questions: 8, hint: "~25 min" },
] as const;

export type InterviewLength = (typeof LENGTHS)[number]["value"];

export type InterviewRow = {
  id: string;
  job_title: string;
  level: string | null;
  plan: InterviewPlan | null;
  status: "pendiente" | "en_curso" | "terminada";
  created_at: string;
};

export type TurnKind = "saludo" | "pregunta" | "repregunta" | "aclaracion" | "respuesta" | "despedida";

export type Turn = {
  role: "ia" | "usuario";
  content: string;
  position: number;
  question_id: number | null;
  kind: TurnKind | null;
};

// ---------- Feedback (fase 5) ----------

export const VERDICTS = {
  listo: { label: "Listo para entrevistas", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  casi: { label: "Casi listo", className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  practicar: { label: "Necesita más práctica", className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
} as const;

export type Verdict = keyof typeof VERDICTS;

export type Competency = { nombre: string; puntaje: number; comentario: string };
export type Improvement = { area: string; consejo: string };
export type QuestionFeedback = {
  question_id: number;
  puntaje: number;
  bien: string;
  mejorar: string;
  respuesta_modelo: string;
};

export type FeedbackRow = {
  interview_id: string;
  overall_score: number;
  verdict: Verdict;
  summary: string;
  competencies: Competency[];
  strengths: string[];
  improvements: Improvement[];
  per_question: QuestionFeedback[];
  next_steps: string[];
  created_at: string;
};

// Lo que devuelve /api/turn al navegador.
export type TurnResponse = {
  say: string; // Lo que la IA dice en voz alta
  kind: TurnKind;
  questionNumber: number; // 1..total (0 en el saludo)
  totalQuestions: number;
  done: boolean;
};
