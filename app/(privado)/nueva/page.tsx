import Link from "next/link";
import { Suspense } from "react";
import { getProfile } from "@/lib/profile";
import { btnPrimary, eyebrow, pageTitle } from "@/lib/ui";
import { NewInterviewForm } from "./NewInterviewForm";

// Preparar el plan con IA tarda ~20 s (aplica a la Server Action de esta página).
export const maxDuration = 60;

export default function NuevaPage(props: PageProps<"/nueva">) {
  return (
    <section className="flex flex-col gap-8">
      <div>
        <p className={eyebrow}>Paso 2</p>
        <h1 className={pageTitle}>Nueva entrevista</h1>
        <p className="mt-1 max-w-xl text-muted">
          Dinos a qué puesto aplicas. La IA cruza tu CV con la oferta y arma las preguntas que probablemente te harían.
        </p>
      </div>
      <Suspense fallback={<p className="text-muted">Cargando…</p>}>
        <FormLoader searchParams={props.searchParams} />
      </Suspense>
    </section>
  );
}

async function FormLoader({ searchParams }: { searchParams: PageProps<"/nueva">["searchParams"] }) {
  const [{ profile }, { puesto }] = await Promise.all([getProfile(), searchParams]);

  if (!profile?.cv_text) {
    return (
      <div className="flex max-w-2xl flex-col items-start gap-3 rounded-3xl border-2 border-ink bg-coral-soft p-6 shadow-hard">
        <p className="font-display text-2xl font-extrabold">Primero, tu CV</p>
        <p className="text-muted">
          Sin él la IA no sabe qué preguntarte. Si todavía no tienes experiencia laboral, no pasa nada: tus proyectos de la
          uni, voluntariados y cursos también cuentan.
        </p>
        <Link href="/perfil" className={btnPrimary}>
          Subir mi CV
        </Link>
      </div>
    );
  }

  return <NewInterviewForm level={profile.level} puesto={typeof puesto === "string" ? puesto.slice(0, 120) : ""} />;
}
