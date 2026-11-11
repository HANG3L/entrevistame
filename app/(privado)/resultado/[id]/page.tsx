import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { QUESTION_TYPES, VERDICTS, type FeedbackRow, type InterviewRow, type Turn } from "@/lib/interview";
import { getFeedback, getInterview, getTurns } from "@/lib/interview-data";
import { groupByQuestion, speechStats } from "@/lib/transcript";
import { btnPrimary, btnSecondary, btnText, card, eyebrow, pageTitle } from "@/lib/ui";
import { GenerateFeedback } from "./GenerateFeedback";

export default function ResultadoPage(props: PageProps<"/resultado/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted">Cargando resultado…</p>}>
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
      <section className="flex max-w-xl flex-col items-start gap-3">
        <h1 className={pageTitle}>Todavía no terminas esta entrevista</h1>
        <p className="text-muted">El feedback aparece cuando respondes todas las preguntas. Tu avance está guardado.</p>
        <Link href={`/entrevista/${id}/sala`} className={btnPrimary}>
          Continuar entrevista →
        </Link>
      </section>
    );
  }

  const [feedback, turns] = await Promise.all([getFeedback(id), getTurns(id)]);

  return (
    <section className="flex max-w-5xl flex-col gap-8">
      <div>
        <Link href="/dashboard" className={btnText}>
          ← Mis entrevistas
        </Link>
        <p className={`${eyebrow} mt-4`}>Tu resultado</p>
        <h1 className={pageTitle}>{interview.plan.puesto}</h1>
        <p className="mt-1 font-mono text-xs text-muted">
          Nivel {interview.plan.nivel} · {new Date(interview.created_at).toLocaleDateString("es", { dateStyle: "long" })}
        </p>
      </div>
      {feedback ? <Report interview={interview} feedback={feedback} turns={turns} /> : <GenerateFeedback interviewId={id} />}
    </section>
  );
}

// ---------- Reporte ----------

const tone10 = (s: number) => (s >= 8 ? "ok" : s >= 6 ? "warn" : "bad");
const BAR = { ok: "bg-ok", warn: "bg-warn", bad: "bg-bad" } as const;
const PILL = { ok: "bg-ok-soft text-ok", warn: "bg-warn-soft text-warn", bad: "bg-bad-soft text-bad" } as const;

function Report({ interview, feedback, turns }: { interview: InterviewRow; feedback: FeedbackRow; turns: Turn[] }) {
  const plan = interview.plan!;
  const verdict = VERDICTS[feedback.verdict] ?? VERDICTS.casi;
  const blocks = groupByQuestion(plan, turns);
  const stats = speechStats(turns);

  return (
    <>
      {/* Puntaje general */}
      <div className="dots flex flex-col items-center gap-6 rounded-[2rem] border-2 border-ink bg-surface p-6 shadow-hard sm:flex-row sm:p-8">
        <ScoreRing score={feedback.overall_score} />
        <div className="flex flex-col items-start gap-3">
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${verdict.className}`}>{verdict.label}</span>
          <h2 className="text-3xl font-extrabold">{verdict.headline}</h2>
          <p className="text-muted">{feedback.summary}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        {/* Competencias */}
        <div className={card}>
          <h2 className="mb-5 text-xl font-bold">Competencias</h2>
          <ul className="flex flex-col gap-5">
            {feedback.competencies.map((c) => (
              <li key={c.nombre}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">{c.nombre}</span>
                  <span className="font-mono text-sm tabular-nums text-muted">{c.puntaje}/10</span>
                </div>
                <div className="mt-1.5 h-3 overflow-hidden rounded-full border border-line bg-surface-2">
                  <div className={`h-full rounded-full ${BAR[tone10(c.puntaje)]}`} style={{ width: `${c.puntaje * 10}%` }} />
                </div>
                <p className="mt-1.5 text-sm text-muted">{c.comentario}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Cómo hablaste */}
        <div className="flex flex-col gap-4 rounded-3xl border-2 border-ink bg-brand p-6 text-brand-ink">
          <h2 className="text-xl font-bold">Cómo hablaste</h2>
          <div className="grid grid-cols-2 gap-4">
            <Stat value={stats.answers} label="respuestas" />
            <Stat value={stats.avgWords} label="palabras por respuesta" />
            <Stat value={stats.totalWords} label="palabras en total" />
            <Stat value={stats.fillerTotal} label="muletillas" />
          </div>
          <p className="text-sm">
            {stats.avgWords < 40
              ? "Tus respuestas fueron cortas. Desarrolla más con ejemplos: qué pasó, qué hiciste tú y qué resultado tuvo."
              : stats.avgWords > 220
                ? "Tus respuestas fueron largas. Practica ir al punto en 1 o 2 minutos."
                : "La longitud de tus respuestas está bien."}
            {stats.fillers.length > 0 &&
              ` Muletillas más usadas: ${stats.fillers
                .slice(0, 3)
                .map((f) => `“${f.word}” (${f.count})`)
                .join(", ")}.`}
          </p>
        </div>
      </div>

      {/* Fortalezas y mejoras */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className={card}>
          <h2 className="mb-4 text-xl font-bold">
            <span className="marker">Lo que hiciste bien</span>
          </h2>
          <ul className="flex flex-col gap-3 text-sm">
            {feedback.strengths.map((s) => (
              <li key={s} className="flex gap-2">
                <span className="text-ok" aria-hidden="true">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className={card}>
          <h2 className="mb-4 text-xl font-bold">Qué mejorar</h2>
          <ol className="flex flex-col gap-4 text-sm">
            {feedback.improvements.map((m, i) => (
              <li key={m.area} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral font-mono text-xs font-bold text-[#17140f]">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold">{m.area}</p>
                  <p className="text-muted">{m.consejo}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Pregunta por pregunta */}
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-extrabold">Pregunta por pregunta</h2>
        {blocks.map(({ question, turns: qTurns }) => {
          const fb = feedback.per_question.find((q) => q.question_id === question.id);
          return (
            <details key={question.id} className={`${card} group transition open:border-ink`}>
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
                <div>
                  <span className="font-mono text-xs uppercase tracking-widest text-coral-text">
                    {question.id}. {QUESTION_TYPES[question.tipo] ?? question.tipo}
                  </span>
                  <p className="mt-1 font-semibold">{question.pregunta}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {fb && (
                    <span className={`rounded-full px-2.5 py-1 font-mono text-sm font-bold ${PILL[tone10(fb.puntaje)]}`}>
                      {fb.puntaje}/10
                    </span>
                  )}
                  <span className="text-xl text-muted transition group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </div>
              </summary>
              <div className="mt-5 flex flex-col gap-4 text-sm">
                <div className="flex flex-col gap-2">
                  {qTurns.map((t) => (
                    <div key={t.position} className={`flex flex-col gap-0.5 ${t.role === "usuario" ? "items-end" : "items-start"}`}>
                      <span className="px-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                        {t.role === "usuario" ? "Tú" : plan.entrevistador}
                      </span>
                      <p
                        className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                          t.role === "usuario" ? "rounded-tr-sm bg-brand-soft" : "rounded-tl-sm bg-surface-2"
                        }`}
                      >
                        {t.content}
                      </p>
                    </div>
                  ))}
                </div>
                {fb && (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <p className="rounded-2xl bg-ok-soft p-3">
                        <span className="font-semibold text-ok">Bien: </span>
                        {fb.bien}
                      </p>
                      <p className="rounded-2xl bg-warn-soft p-3">
                        <span className="font-semibold text-warn">A mejorar: </span>
                        {fb.mejorar}
                      </p>
                    </div>
                    <div className="rounded-2xl border-2 border-dashed border-ink p-4">
                      <p className="mb-1 font-mono text-xs uppercase tracking-widest text-muted">Así podrías decirlo</p>
                      <p className="italic">“{fb.respuesta_modelo}”</p>
                    </div>
                  </>
                )}
              </div>
            </details>
          );
        })}
      </div>

      {/* Próximos pasos */}
      <div className="rounded-[2rem] border-2 border-ink bg-[#17140f] p-6 text-[#f4efe5] sm:p-8">
        <h2 className="text-3xl font-extrabold">
          Tu plan para la <span className="text-brand">próxima</span>
        </h2>
        <ol className="mt-5 flex flex-col gap-3">
          {feedback.next_steps.map((s, i) => (
            <li key={s} className="flex gap-3">
              <span className="font-display text-2xl font-extrabold text-brand">0{i + 1}</span>
              <span className="pt-1 text-sm opacity-90">{s}</span>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/nueva?puesto=${encodeURIComponent(plan.puesto)}`} className={`${btnPrimary} border-[#17140f]`}>
            Practicar otra vez este puesto
          </Link>
          <Link href="/dashboard" className={`${btnSecondary} border-[#f4efe5]/30 hover:border-[#f4efe5]`}>
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
      <p className="font-display text-4xl font-extrabold tabular-nums">{value}</p>
      <p className="font-mono text-[10px] uppercase tracking-widest opacity-70">{label}</p>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const color = score >= 80 ? "var(--ok)" : score >= 60 ? "var(--warn)" : "var(--bad)";
  return (
    <div className="relative h-40 w-40 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="var(--surface)" stroke="var(--surface-2)" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl font-extrabold tabular-nums">{score}</span>
        <span className="font-mono text-xs text-muted">de 100</span>
      </div>
    </div>
  );
}
