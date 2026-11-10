import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { QUESTION_TYPES, type QuestionType } from "@/lib/interview";
import { getInterview } from "@/lib/interview-data";

export default function EntrevistaPage(props: PageProps<"/entrevista/[id]">) {
  return (
    <Suspense fallback={<p className="text-zinc-500">Cargando entrevista…</p>}>
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

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-indigo-600">Tu entrevista está lista</p>
        <h1 className="text-2xl font-bold">{plan.puesto}</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Nivel {plan.nivel} · {plan.preguntas.length} preguntas · Entrevistador: {plan.entrevistador}
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="font-semibold">Lo que la IA vio en tu CV</h2>
        <p className="mt-2 text-zinc-700 dark:text-zinc-300">{plan.resumen_candidato}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <List title="Fortalezas para el puesto" items={plan.fortalezas} color="text-emerald-600" />
          <List title="Temas que va a explorar" items={plan.brechas} color="text-amber-600" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(byType).map(([tipo, n]) => (
          <span
            key={tipo}
            className="rounded-full bg-zinc-100 px-3 py-1 text-sm dark:bg-zinc-900"
          >
            {QUESTION_TYPES[tipo as QuestionType] ?? tipo}: {n}
          </span>
        ))}
      </div>

      <div className="rounded-2xl bg-indigo-50 p-5 dark:bg-indigo-950/30">
        <h2 className="font-semibold">Antes de empezar</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
          <li>Usa Chrome o Edge y permite el acceso al micrófono.</li>
          <li>Busca un lugar tranquilo; mejor si usas audífonos.</li>
          <li>Responde como en una entrevista real: la IA puede repreguntar sobre lo que digas.</li>
        </ul>
        <button
          disabled
          className="mt-4 rounded-full bg-indigo-600 px-6 py-2.5 font-medium text-white opacity-60"
        >
          Comenzar entrevista (fase 3)
        </button>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-zinc-500">
          Ver las preguntas (spoiler: le quita realismo a la práctica)
        </summary>
        <ol className="mt-3 flex flex-col gap-3">
          {plan.preguntas.map((q) => (
            <li key={q.id} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <span className="text-xs font-medium text-indigo-600">
                {QUESTION_TYPES[q.tipo] ?? q.tipo}
              </span>
              <p className="mt-1">{q.pregunta}</p>
              <p className="mt-1 text-zinc-500">Evalúa: {q.objetivo}</p>
            </li>
          ))}
        </ol>
      </details>

      <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">
        ← Volver a mis entrevistas
      </Link>
    </section>
  );
}

function List({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div>
      <h3 className={`text-sm font-semibold ${color}`}>{title}</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
