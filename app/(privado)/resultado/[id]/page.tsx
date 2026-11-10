import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { QUESTION_TYPES, VERDICTS, type FeedbackRow, type InterviewRow, type Turn } from "@/lib/interview";
import { getFeedback, getInterview, getTurns } from "@/lib/interview-data";
import { groupByQuestion, speechStats } from "@/lib/transcript";
import { GenerateFeedback } from "./GenerateFeedback";

export default function ResultadoPage(props: PageProps<"/resultado/[id]">) {
  return (
    <Suspense fallback={<p className="text-zinc-500">Cargando resultado…</p>}>
      <Results params={props.params} />
    </Suspense>
  );
}

async function Results({ params }: { params: PageProps<"/resultado/[id]">["params"] }) {
  const { id } = await params;
  const interview = await getInterview(id);
  if (!interview?.plan) notFound();

  if (interview.status !== "terminada") {
    return (
      <section className="flex max-w-xl flex-col gap-3">
        <h1 className="text-2xl font-bold">Todavía no terminas esta entrevista</h1>
        <p className="text-zinc-600 dark:text-zinc-400">El feedback aparece cuando respondes todas las preguntas.</p>
        <Link
          href={`/entrevista/${id}/sala`}
          className="w-fit rounded-full bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
        >
          Continuar entrevista
        </Link>
      </section>
    );
  }

  const [feedback, turns] = await Promise.all([getFeedback(id), getTurns(id)]);

  return (
    <section className="flex max-w-4xl flex-col gap-8">
      <div>
        <p className="text-sm font-medium text-indigo-600">Resultado de tu entrevista</p>
        <h1 className="text-2xl font-bold">{interview.plan.puesto}</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Nivel {interview.plan.nivel} · {new Date(interview.created_at).toLocaleDateString("es")}
        </p>
      </div>
      {feedback ? <Report interview={interview} feedback={feedback} turns={turns} /> : <GenerateFeedback interviewId={id} />}
    </section>
  );
}

// ---------- Reporte ----------

const card = "rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800";

function scoreColor(score10: number) {
  return score10 >= 8 ? "bg-emerald-500" : score10 >= 6 ? "bg-amber-500" : "bg-red-500";
}

function Report({ interview, feedback, turns }: { interview: InterviewRow; feedback: FeedbackRow; turns: Turn[] }) {
  const plan = interview.plan!;
  const verdict = VERDICTS[feedback.verdict] ?? VERDICTS.casi;
  const blocks = groupByQuestion(plan, turns);
  const stats = speechStats(turns);

  return (
    <>
      {/* Puntaje general */}
      <div className={`${card} flex flex-col items-center gap-6 sm:flex-row`}>
        <ScoreRing score={feedback.overall_score} />
        <div className="flex flex-col gap-2">
          <span className={`w-fit rounded-full px-3 py-1 text-sm font-medium ${verdict.className}`}>{verdict.label}</span>
          <p className="text-zinc-700 dark:text-zinc-300">{feedback.summary}</p>
        </div>
      </div>

      {/* Competencias */}
      <div className={card}>
        <h2 className="mb-4 font-semibold">Competencias</h2>
        <ul className="flex flex-col gap-4">
          {feedback.competencies.map((c) => (
            <li key={c.nombre}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{c.nombre}</span>
                <span className="text-sm tabular-nums text-zinc-500">{c.puntaje}/10</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div className={`h-full rounded-full ${scoreColor(c.puntaje)}`} style={{ width: `${c.puntaje * 10}%` }} />
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{c.comentario}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Fortalezas y mejoras */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className={card}>
          <h2 className="mb-3 font-semibold text-emerald-600">Lo que hiciste bien</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
            {feedback.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div className={card}>
          <h2 className="mb-3 font-semibold text-amber-600">Qué mejorar</h2>
          <ul className="flex flex-col gap-3 text-sm">
            {feedback.improvements.map((m) => (
              <li key={m.area}>
                <p className="font-medium">{m.area}</p>
                <p className="text-zinc-600 dark:text-zinc-400">{m.consejo}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Cómo hablaste */}
      <div className={card}>
        <h2 className="mb-3 font-semibold">Cómo hablaste</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat value={stats.answers} label="respuestas" />
          <Stat value={stats.avgWords} label="palabras por respuesta" />
          <Stat value={stats.totalWords} label="palabras en total" />
          <Stat value={stats.fillerTotal} label="muletillas" />
        </div>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          {stats.avgWords < 40
            ? "Tus respuestas fueron cortas. Intenta desarrollar más con ejemplos concretos (situación, acción y resultado)."
            : stats.avgWords > 220
              ? "Tus respuestas fueron largas. Practica ir al punto en 1 o 2 minutos."
              : "La longitud de tus respuestas es adecuada."}
          {stats.fillers.length > 0 &&
            ` Muletillas más usadas: ${stats.fillers
              .slice(0, 3)
              .map((f) => `“${f.word}” (${f.count})`)
              .join(", ")}.`}
        </p>
      </div>

      {/* Pregunta por pregunta */}
      <div className="flex flex-col gap-3">
        <h2 className="font-semibold">Pregunta por pregunta</h2>
        {blocks.map(({ question, turns: qTurns }) => {
          const fb = feedback.per_question.find((q) => q.question_id === question.id);
          return (
            <details key={question.id} className={`${card} group`}>
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-medium text-indigo-600">
                    {question.id}. {QUESTION_TYPES[question.tipo] ?? question.tipo}
                  </span>
                  <p className="font-medium">{question.pregunta}</p>
                </div>
                {fb && (
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-semibold text-white ${scoreColor(fb.puntaje)}`}>
                    {fb.puntaje}/10
                  </span>
                )}
              </summary>
              <div className="mt-4 flex flex-col gap-4 text-sm">
                <div className="flex flex-col gap-2 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900">
                  {qTurns.map((t) => (
                    <p key={t.position} className={t.role === "usuario" ? "" : "text-zinc-500"}>
                      <span className="font-semibold">{t.role === "usuario" ? "Tú" : plan.entrevistador}:</span> {t.content}
                    </p>
                  ))}
                </div>
                {fb && (
                  <>
                    <p>
                      <span className="font-semibold text-emerald-600">Bien: </span>
                      {fb.bien}
                    </p>
                    <p>
                      <span className="font-semibold text-amber-600">A mejorar: </span>
                      {fb.mejorar}
                    </p>
                    <div className="rounded-xl border-l-4 border-indigo-500 bg-indigo-50 p-3 dark:bg-indigo-950/30">
                      <p className="mb-1 font-semibold">Una respuesta más fuerte podría ser:</p>
                      <p className="italic text-zinc-700 dark:text-zinc-300">“{fb.respuesta_modelo}”</p>
                    </div>
                  </>
                )}
              </div>
            </details>
          );
        })}
      </div>

      {/* Próximos pasos */}
      <div className={card}>
        <h2 className="mb-3 font-semibold">Tus próximos pasos</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
          {feedback.next_steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/nueva?puesto=${encodeURIComponent(plan.puesto)}`}
            className="rounded-full bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
          >
            Practicar de nuevo este puesto
          </Link>
          <Link href="/dashboard" className="rounded-full border border-zinc-300 px-5 py-2.5 font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900">
            Ver mis entrevistas
          </Link>
        </div>
      </div>
    </>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-zinc-100 dark:text-zinc-800" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tabular-nums">{score}</span>
        <span className="text-xs text-zinc-500">de 100</span>
      </div>
    </div>
  );
}
