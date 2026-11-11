import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { QUESTION_TYPES, type QuestionType } from "@/lib/interview";
import { getInterview } from "@/lib/interview-data";
import { btnPrimary, btnText, card, eyebrow, pageTitle } from "@/lib/ui";

export default function EntrevistaPage(props: PageProps<"/entrevista/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted">Cargando entrevista…</p>}>
      <Briefing params={props.params} />
    </Suspense>
  );
}

async function Briefing({ params }: { params: PageProps<"/entrevista/[id]">["params"] }) {
  const { id } = await params;
  const interview = await getInterview(id);
  if (!interview?.plan) notFound();
  const plan = interview.plan;

  const byType = plan.preguntas.reduce<Partial<Record<QuestionType, number>>>((acc, q) => {
    acc[q.tipo] = (acc[q.tipo] ?? 0) + 1;
    return acc;
  }, {});

  const cta =
    interview.status === "terminada"
      ? { href: `/resultado/${interview.id}`, label: "Ver mi resultado" }
      : {
          href: `/entrevista/${interview.id}/sala`,
          label: interview.status === "en_curso" ? "Continuar entrevista →" : "Entrar a la sala →",
        };

  return (
    <section className="flex max-w-4xl flex-col gap-6">
      <Link href="/dashboard" className={btnText}>
        ← Mis entrevistas
      </Link>

      <div>
        <p className={eyebrow}>Tu entrevista está lista</p>
        <h1 className={pageTitle}>{plan.puesto}</h1>
        <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs">
          <Chip>Nivel {plan.nivel}</Chip>
          <Chip>{plan.preguntas.length} preguntas</Chip>
          {Object.entries(byType).map(([tipo, n]) => (
            <Chip key={tipo}>
              {n} {QUESTION_TYPES[tipo as QuestionType] ?? tipo}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className={card}>
          <h2 className="text-xl font-bold">Lo que {plan.entrevistador} vio en tu CV</h2>
          <p className="mt-2 text-muted">{plan.resumen_candidato}</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <List title="Tus cartas fuertes" items={plan.fortalezas} dot="bg-brand" />
            <List title="Te va a preguntar por" items={plan.brechas} dot="bg-coral" />
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border-2 border-ink bg-brand p-6 text-brand-ink shadow-hard">
          <h2 className="text-2xl font-extrabold">Antes de entrar</h2>
          <ul className="flex flex-col gap-2 text-sm">
            <li>🎧 Busca un lugar tranquilo; con audífonos va mejor.</li>
            <li>🌐 Usa Chrome o Edge y permite el micrófono.</li>
            <li>💬 Responde como si fuera real: te puede repreguntar.</li>
            <li>⏸️ Si sales, tu avance se guarda.</li>
          </ul>
          <Link
            href={cta.href}
            className="mt-auto inline-flex items-center justify-center rounded-full border-2 border-[#17140f] bg-[#17140f] px-6 py-3 font-semibold text-[#f4efe5] transition hover:-translate-y-0.5"
          >
            {cta.label}
          </Link>
        </div>
      </div>

      <details className={`${card} group`}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
          <span className="font-semibold">
            Ver las preguntas <span className="font-normal text-muted">(spoiler: le quita realismo)</span>
          </span>
          <span className="text-muted transition group-open:rotate-45" aria-hidden="true">
            +
          </span>
        </summary>
        <ol className="mt-4 flex flex-col gap-3">
          {plan.preguntas.map((q) => (
            <li key={q.id} className="rounded-2xl bg-surface-2 p-4">
              <span className="font-mono text-xs uppercase tracking-widest text-coral-text">
                {q.id}. {QUESTION_TYPES[q.tipo] ?? q.tipo}
              </span>
              <p className="mt-1 font-medium">{q.pregunta}</p>
              <p className="mt-1 text-sm text-muted">Evalúa: {q.objetivo}</p>
            </li>
          ))}
        </ol>
      </details>

      {interview.status === "terminada" && (
        <Link href={cta.href} className={`${btnPrimary} w-fit`}>
          {cta.label}
        </Link>
      )}
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-line bg-surface px-3 py-1">{children}</span>;
}

function List({ title, items, dot }: { title: string; items: string[]; dot: string }) {
  return (
    <div>
      <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">{title}</h3>
      <ul className="mt-2 flex flex-col gap-2 text-sm">
        {items.map((it) => (
          <li key={it} className="flex gap-2">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full border border-ink ${dot}`} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
