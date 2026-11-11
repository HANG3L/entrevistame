import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GoogleButton } from "@/components/GoogleButton";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isSupabaseConfigured } from "@/lib/env";
import { getUser } from "@/lib/supabase/server";
import { eyebrow } from "@/lib/ui";

const steps = [
  { title: "Sube tu CV", text: "La IA lee tu experiencia, tus proyectos de la uni y tus habilidades." },
  { title: "Elige el puesto", text: "Pega la oferta y arma una entrevista hecha para ese cargo." },
  { title: "Habla, como en una llamada", text: "Respondes con tu voz y te repregunta si algo queda flojo." },
  { title: "Recibe tu feedback", text: "Puntaje, qué hiciste bien y cómo sonaría una respuesta más fuerte." },
];

const truths = [
  {
    title: "Los nervios se entrenan",
    text: "La primera vez que te preguntan “¿por qué deberíamos contratarte?” no debería ser frente al reclutador.",
  },
  {
    title: "Te van a repreguntar",
    text: "“¿Y cuál fue tu parte en ese proyecto?” Aquí practicas defender lo que pones en tu CV.",
  },
  {
    title: "Nadie te da feedback",
    text: "Las empresas casi nunca te dicen por qué no quedaste. Aquí sí, pregunta por pregunta.",
  },
];

const audiences = ["Primer empleo", "Pasantías", "Práctica profesional", "Becas", "Cambio de carrera"];

export default function Home(props: PageProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex-1">
        {/* Portada */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-12">
          <div className="flex flex-col items-start gap-6">
            <span className="-rotate-2 rounded-full border-2 border-ink bg-coral px-3 py-1 font-mono text-xs font-semibold uppercase tracking-widest text-[#17140f] shadow-hard-sm">
              Para tu primer empleo
            </span>
            <h1 className="font-display text-5xl font-extrabold leading-[0.95] sm:text-6xl lg:text-7xl">
              Que tu primera entrevista <span className="marker text-ink">no sea la primera.</span>
            </h1>
            <p className="max-w-xl text-lg text-muted">
              Practica con una IA que leyó tu CV, te pregunta como un reclutador de verdad y te dice exactamente
              qué mejorar. Por voz, gratis y sin que nadie te juzgue.
            </p>
            <div className="flex flex-col items-start gap-3">
              <GoogleButton disabled={!isSupabaseConfigured} label="Empezar gratis con Google" />
              <p className="font-mono text-xs text-muted">Solo necesitas tu CV en PDF y un micrófono.</p>
              {!isSupabaseConfigured && (
                <p className="text-sm text-warn">
                  Falta configurar Supabase en <code>.env.local</code> para poder iniciar sesión.
                </p>
              )}
              <Suspense>
                <LoginStatus searchParams={props.searchParams} />
              </Suspense>
            </div>
          </div>

          <CallPreview />
        </section>

        {/* Para quién */}
        <section className="border-y-2 border-ink bg-brand text-brand-ink">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4 sm:px-6">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest">Ideal si buscas</span>
            {audiences.map((a) => (
              <span key={a} className="font-display text-lg font-bold">
                {a} <span aria-hidden="true">✦</span>
              </span>
            ))}
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <p className={eyebrow}>Cómo funciona</p>
          <h2 className="mt-2 max-w-2xl text-4xl font-extrabold">De tu CV a tu feedback en unos 15 minutos.</h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-3 rounded-3xl border-2 border-line bg-surface p-5 transition hover:-translate-y-1 hover:border-ink hover:shadow-hard">
                <span className="font-display text-5xl font-extrabold text-brand-text">0{i + 1}</span>
                <h3 className="text-xl font-bold">{s.title}</h3>
                <p className="text-sm text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Verdades */}
        <section className="dots border-y border-line">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <p className={eyebrow}>Real talk</p>
            <h2 className="mt-2 max-w-2xl text-4xl font-extrabold">Lo que nadie te dice de tu primera entrevista.</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {truths.map((t, i) => (
                <div
                  key={t.title}
                  className={`rounded-3xl border-2 border-ink bg-surface p-6 shadow-hard ${i === 1 ? "md:rotate-1" : i === 2 ? "md:-rotate-1" : ""}`}
                >
                  <h3 className="text-2xl font-extrabold">{t.title}</h3>
                  <p className="mt-3 text-muted">{t.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Llamado final */}
        <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-col items-start gap-6 rounded-[2rem] border-2 border-ink bg-[#17140f] p-8 text-[#f4efe5] sm:p-12 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-4xl font-extrabold sm:text-5xl">
                Equivócate aquí, <span className="text-brand">no allá.</span>
              </h2>
              <p className="mt-3 max-w-lg opacity-75">Haz tu primera práctica hoy. Mañana ya vas con más calma.</p>
            </div>
            <GoogleButton disabled={!isSupabaseConfigured} label="Practicar ahora" />
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:px-6">
          <Logo />
          <p>Prototipo académico · Hecho con IA para gente que va empezando.</p>
        </div>
      </footer>
    </div>
  );
}

/** Ilustración de una llamada de práctica, hecha solo con HTML. */
function CallPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden="true">
      <div className="dots rounded-[2rem] border-2 border-ink bg-surface p-5 shadow-hard sm:p-6">
        <div className="mb-5 flex items-center justify-between font-mono text-xs text-muted">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-coral" /> En llamada · 04:12
          </span>
          <span>Pregunta 3 de 6</span>
        </div>

        <div className="flex flex-col gap-3">
          <Bubble who="Valeria · Entrevistadora" side="left">
            Cuéntame de un proyecto del que te sientas orgulloso.
          </Bubble>
          <Bubble who="Tú" side="right">
            En la uni armamos una app para pedir turnos en la cafetería. Yo hice el backend…
          </Bubble>
          <Bubble who="Valeria · Entrevistadora" side="left">
            ¿Y qué decisión técnica cambiarías si lo hicieras hoy?
          </Bubble>
          <div className="flex items-center gap-1.5 self-end rounded-full border-2 border-ink bg-brand px-4 py-2.5">
            {[0, 150, 300].map((d) => (
              <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-[#17140f]" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        </div>
      </div>

      <div className="absolute -bottom-6 -left-3 rotate-[-4deg] rounded-2xl border-2 border-ink bg-surface px-4 py-3 shadow-hard sm:-left-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Tu puntaje</p>
        <p className="font-display text-3xl font-extrabold">
          82<span className="text-base text-muted">/100</span>
        </p>
      </div>
      <div className="absolute -right-2 -top-4 rotate-[5deg] rounded-full border-2 border-ink bg-coral px-3 py-1 text-sm font-bold text-[#17140f] shadow-hard-sm">
        ¡te repreguntó!
      </div>
    </div>
  );
}

function Bubble({ who, side, children }: { who: string; side: "left" | "right"; children: React.ReactNode }) {
  const left = side === "left";
  return (
    <div className={`flex max-w-[85%] flex-col gap-1 ${left ? "self-start" : "self-end items-end"}`}>
      <span className="px-1 font-mono text-[10px] uppercase tracking-widest text-muted">{who}</span>
      <p
        className={`rounded-2xl border-2 border-ink px-4 py-2.5 text-sm font-medium text-[#17140f] ${
          left ? "rounded-tl-sm bg-coral-soft dark:bg-coral" : "rounded-tr-sm bg-brand"
        }`}
      >
        {children}
      </p>
    </div>
  );
}

// Si ya hay sesión, va directo al dashboard. Si el login falló, muestra el aviso.
async function LoginStatus({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  if (isSupabaseConfigured && (await getUser())) redirect("/dashboard");
  const { error } = await searchParams;
  if (error !== "login") return null;
  return <p className="text-sm text-bad">No se pudo iniciar sesión. Intenta de nuevo.</p>;
}
