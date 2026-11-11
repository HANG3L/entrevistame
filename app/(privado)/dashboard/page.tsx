import Link from "next/link";
import { Suspense } from "react";
import { listInterviews } from "@/lib/interview-data";
import { btnPrimary, btnSecondary, eyebrow, pageTitle } from "@/lib/ui";

const STATUS = {
  pendiente: { label: "Lista para empezar", className: "bg-brand-soft text-brand-text" },
  en_curso: { label: "A medias", className: "bg-warn-soft text-warn" },
  terminada: { label: "Terminada", className: "bg-surface-2 text-muted" },
} as const;

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={eyebrow}>Tu historial</p>
          <h1 className={pageTitle}>Tus prácticas</h1>
          <p className="mt-1 text-muted">Cada entrevista te deja un poco más listo para la de verdad.</p>
        </div>
        <Link href="/nueva" className={btnPrimary}>
          + Nueva entrevista
        </Link>
      </div>
      <Suspense fallback={<p className="text-muted">Cargando…</p>}>
        <InterviewList />
      </Suspense>
    </div>
  );
}

const scoreTone = (s: number) => (s >= 80 ? "text-ok" : s >= 60 ? "text-warn" : "text-bad");

async function InterviewList() {
  const interviews = await listInterviews();

  if (interviews.length === 0) {
    return (
      <div className="dots flex flex-col items-center gap-4 rounded-[2rem] border-2 border-dashed border-line px-6 py-16 text-center">
        <p className="font-display text-3xl font-extrabold">Aquí empieza tu racha.</p>
        <p className="max-w-md text-muted">
          Sube tu CV, elige el puesto que te interesa y haz tu primera práctica. Toma unos 15 minutos.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/nueva" className={btnPrimary}>
            Hacer mi primera entrevista
          </Link>
          <Link href="/perfil" className={btnSecondary}>
            Subir mi CV
          </Link>
        </div>
      </div>
    );
  }

  const scores = interviews
    .map((it) => (Array.isArray(it.feedback) ? it.feedback[0] : it.feedback)?.overall_score)
    .filter((s): s is number => typeof s === "number");
  const best = scores.length ? Math.max(...scores) : null;
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Prácticas" value={interviews.length} />
        <Stat label="Mejor puntaje" value={best ?? "—"} highlight />
        <Stat label="Promedio" value={avg ?? "—"} />
      </div>

      <ul className="grid gap-3 md:grid-cols-2">
        {interviews.map((it) => {
          const status = STATUS[it.status];
          // Supabase devuelve la relación 1 a 1 como objeto (o arreglo según la versión).
          const fb = Array.isArray(it.feedback) ? it.feedback[0] : it.feedback;
          const score: number | undefined = fb?.overall_score;
          const href = it.status === "terminada" ? `/resultado/${it.id}` : `/entrevista/${it.id}`;
          return (
            <li key={it.id}>
              <Link
                href={href}
                className="group flex h-full items-center justify-between gap-4 rounded-3xl border-2 border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-ink hover:shadow-hard"
              >
                <div className="min-w-0">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}>
                    {status.label}
                  </span>
                  <p className="mt-2 truncate font-display text-xl font-bold">{it.job_title}</p>
                  <p className="font-mono text-xs text-muted">
                    {it.plan?.nivel ?? it.level} · {it.plan?.preguntas.length ?? 0} preguntas ·{" "}
                    {new Date(it.created_at).toLocaleDateString("es", { day: "numeric", month: "short" })}
                  </p>
                </div>
                {score !== undefined ? (
                  <span className={`shrink-0 font-display text-4xl font-extrabold tabular-nums ${scoreTone(score)}`}>
                    {score}
                  </span>
                ) : (
                  <span className="shrink-0 text-2xl text-muted transition group-hover:translate-x-1 group-hover:text-ink" aria-hidden="true">
                    →
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <div className={`rounded-3xl border-2 p-4 sm:p-5 ${highlight ? "border-ink bg-brand text-brand-ink shadow-hard-sm" : "border-line bg-surface"}`}>
      <p className={`font-mono text-[10px] uppercase tracking-widest sm:text-xs ${highlight ? "" : "text-muted"}`}>{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold tabular-nums sm:text-4xl">{value}</p>
    </div>
  );
}
