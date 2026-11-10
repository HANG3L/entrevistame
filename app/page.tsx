import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GoogleButton } from "@/components/GoogleButton";
import { isSupabaseConfigured } from "@/lib/env";
import { getUser } from "@/lib/supabase/server";

const steps = [
  { title: "Sube tu CV", text: "La IA analiza tu experiencia y habilidades." },
  { title: "Elige el puesto", text: "Prepara una entrevista a la medida del cargo." },
  { title: "Responde con tu voz", text: "Como en una reunión real, con repreguntas." },
  { title: "Recibe feedback", text: "Puntaje, fortalezas y qué mejorar." },
];

export default function Home(props: PageProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-10 px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-4">
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          Prototipo
        </span>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Entrevistame</h1>
        <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Practica entrevistas de trabajo hablando con una IA que conoce tu CV y el puesto al
          que aplicas.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <GoogleButton disabled={!isSupabaseConfigured} />
        {!isSupabaseConfigured && (
          <p className="text-sm text-amber-600">
            Falta configurar Supabase en <code>.env.local</code> para poder iniciar sesión.
          </p>
        )}
        <Suspense>
          <LoginStatus searchParams={props.searchParams} />
        </Suspense>
      </div>

      <ol className="grid w-full gap-4 sm:grid-cols-4">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="rounded-2xl border border-zinc-200 p-4 text-left dark:border-zinc-800"
          >
            <span className="text-sm font-semibold text-indigo-600">Paso {i + 1}</span>
            <h2 className="mt-1 font-semibold">{s.title}</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{s.text}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}

// Si ya hay sesión, va directo al dashboard. Si el login falló, muestra el aviso.
async function LoginStatus({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  if (isSupabaseConfigured && (await getUser())) redirect("/dashboard");
  const { error } = await searchParams;
  if (error !== "login") return null;
  return <p className="text-sm text-red-600">No se pudo iniciar sesión. Intenta de nuevo.</p>;
}
