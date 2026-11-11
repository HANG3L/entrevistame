"use client";

import { useActionState } from "react";
import { LENGTHS } from "@/lib/interview";
import { LEVELS, type Level } from "@/lib/levels";
import { btnPrimary, input, optionCard } from "@/lib/ui";
import { createInterview, type NewInterviewState } from "./actions";

const IDEAS = ["Pasante de marketing digital", "Desarrollador Frontend Jr", "Asistente contable", "Atención al cliente"];

export function NewInterviewForm({ level, puesto }: { level: Level | null; puesto: string }) {
  const [state, formAction, pending] = useActionState<NewInterviewState, FormData>(createInterview, {});

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-8">
      <label className="flex flex-col gap-2">
        <span className="font-semibold">¿A qué puesto aplicas?</span>
        <input
          name="puesto"
          defaultValue={puesto}
          required
          minLength={3}
          maxLength={120}
          list="ideas-puesto"
          placeholder="Ej. Desarrollador Frontend Jr"
          className={`${input} text-lg`}
        />
        <datalist id="ideas-puesto">
          {IDEAS.map((i) => (
            <option key={i} value={i} />
          ))}
        </datalist>
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-semibold">
          La oferta de trabajo <span className="font-normal text-muted">(opcional, pero ayuda mucho)</span>
        </span>
        <textarea
          name="oferta"
          rows={5}
          maxLength={6000}
          placeholder="Pega aquí la publicación de LinkedIn, Computrabajo o donde la viste. Con ella las preguntas se parecen más a las reales."
          className={input}
        />
      </label>

      <fieldset>
        <legend className="mb-2 font-semibold">Nivel del puesto</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {LEVELS.map((l) => (
            <label key={l.value} className={optionCard}>
              <input type="radio" name="level" value={l.value} defaultChecked={(level ?? "junior") === l.value} className="sr-only" />
              <span className="block font-semibold">{l.label}</span>
              <span className="text-sm text-muted">{l.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-semibold">¿Cuánto tiempo tienes?</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {LENGTHS.map((l) => (
            <label key={l.value} className={optionCard}>
              <input type="radio" name="length" value={l.value} defaultChecked={l.value === "normal"} className="sr-only" />
              <span className="flex items-baseline justify-between">
                <span className="font-semibold">{l.label}</span>
                <span className="font-mono text-xs text-muted">{l.hint}</span>
              </span>
              <span className="text-sm text-muted">{l.questions} preguntas</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className={`${btnPrimary} py-3 text-base`}>
          {pending ? "La IA está leyendo tu CV…" : "Preparar mi entrevista →"}
        </button>
        {pending && <p className="text-sm text-muted">Tarda unos 20 segundos.</p>}
        {state.error && <p className="text-sm text-bad">{state.error}</p>}
      </div>
    </form>
  );
}
