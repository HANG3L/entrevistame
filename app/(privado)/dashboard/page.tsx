import Link from "next/link";
import { Suspense } from "react";
import { listInterviews } from "@/lib/interview-data";

const STATUS = {
  pendiente: { label: "Lista para empezar", className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" },
  en_curso: { label: "En curso", className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  terminada: { label: "Terminada", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
} as const;

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tus entrevistas</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Tu historial de práctica.</p>
        </div>
        <Link
          href="/nueva"
          className="rounded-full bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
        >
          Nueva entrevista
        </Link>
      </div>
      <Suspense fallback={<p className="text-zinc-500">Cargando…</p>}>
        <InterviewList />
      </Suspense>
    </div>
  );
}

async function InterviewList() {
  const interviews = await listInterviews();

  if (interviews.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">
        Todavía no tienes entrevistas. Sube tu CV en Perfil y crea la primera.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {interviews.map((it) => {
        const status = STATUS[it.status];
        const href = it.status === "terminada" ? `/resultado/${it.id}` : `/entrevista/${it.id}`;
        return (
          <li key={it.id}>
            <Link
              href={href}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4 transition hover:border-indigo-400 dark:border-zinc-800"
            >
              <div>
                <p className="font-medium">{it.job_title}</p>
                <p className="text-sm text-zinc-500">
                  {it.plan?.nivel ?? it.level} · {it.plan?.preguntas.length ?? 0} preguntas ·{" "}
                  {new Date(it.created_at).toLocaleDateString("es")}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>
                {status.label}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
