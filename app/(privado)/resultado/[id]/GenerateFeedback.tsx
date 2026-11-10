"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 p-8 text-center dark:border-red-900">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setAttempt((a) => a + 1);
          }}
          className="rounded-full bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-200 p-10 text-center dark:border-zinc-800">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      <p className="font-medium">La IA está evaluando tu entrevista</p>
      <p className="text-sm text-zinc-500">{MESSAGES[step]}</p>
      <p className="text-xs text-zinc-400">Suele tardar entre 15 y 30 segundos.</p>
    </div>
  );
}
