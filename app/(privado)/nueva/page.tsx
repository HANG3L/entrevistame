import Link from "next/link";
import { Suspense } from "react";
import { getProfile } from "@/lib/profile";
import { NewInterviewForm } from "./NewInterviewForm";

// Preparar el plan con IA tarda ~20 s (aplica a la Server Action de esta página).
export const maxDuration = 60;

export default function NuevaPage(props: PageProps<"/nueva">) {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Nueva entrevista</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Dinos a qué puesto aplicas. La IA analizará tu CV y preparará una entrevista a tu medida.
        </p>
      </div>
      <Suspense fallback={<p className="text-zinc-500">Cargando…</p>}>
        <FormLoader searchParams={props.searchParams} />
      </Suspense>
    </section>
  );
}

async function FormLoader({ searchParams }: { searchParams: PageProps<"/nueva">["searchParams"] }) {
  const [{ profile }, { puesto }] = await Promise.all([getProfile(), searchParams]);

  if (!profile?.cv_text) {
    return (
      <div className="max-w-2xl rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
        <p className="font-medium">Primero necesitamos tu CV</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          La IA lo usa para hacerte preguntas sobre tu experiencia real.
        </p>
        <Link
          href="/perfil"
          className="mt-3 inline-block rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Ir a mi perfil
        </Link>
      </div>
    );
  }

  return (
    <NewInterviewForm level={profile.level} puesto={typeof puesto === "string" ? puesto.slice(0, 120) : ""} />
  );
}
