"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { btnPrimary } from "@/lib/ui";

const MESSAGES = [
  "Leyendo tus respuestas…",
  "Comparándolas con lo que busca el puesto…",
  "Calificando cada competencia…",
  "Escribiendo respuestas modelo con tu experiencia…",
  "Preparando tus próximos pasos…",
];

// Evita pedir el feedback dos veces (React ejecuta los efectos doble en desarrollo).
const inFlight = new Map<string, Promise<string | null>>();

function requestFeedback(interviewId: string) {
  let p = inFlight.get(interviewId);
  if (!p) {
    p = fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interviewId }),
    })
      .then(async (res) => (res.ok ? null : ((await res.json().catch(() => ({}))).error ?? "No se pudo generar el feedback.")))
      .catch(() => "Se perdió la conexión con el servidor.")
      .finally(() => inFlight.delete(interviewId));
    inFlight.set(interviewId, p);
  }
  return p;
}

export function GenerateFeedback({ interviewId }: { interviewId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let active = true;
    requestFeedback(interviewId).then((err) => {
      if (!active) return;
      if (err) setError(err);
      else router.refresh();
    });
    const id = window.setInterval(() => setStep((s) => (s + 1) % MESSAGES.length), 3500);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [interviewId, attempt, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[2rem] border-2 border-dashed border-bad bg-bad-soft p-10 text-center">
        <p className="font-medium text-bad">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setAttempt((a) => a + 1);
          }}
          className={btnPrimary}
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div className="dots flex flex-col items-center gap-4 rounded-[2rem] border-2 border-ink bg-surface p-12 text-center shadow-hard">
      <div className="flex gap-2" aria-hidden="true">
        {[0, 150, 300].map((d) => (
          <span key={d} className="h-4 w-4 animate-bounce rounded-full border-2 border-ink bg-brand" style={{ animationDelay: `${d}ms` }} />
        ))}
      </div>
      <p className="font-display text-2xl font-extrabold">Revisando tu entrevista…</p>
      <p className="text-muted">{MESSAGES[step]}</p>
      <p className="font-mono text-xs text-muted">Suele tardar entre 15 y 30 segundos.</p>
    </div>
  );
}
