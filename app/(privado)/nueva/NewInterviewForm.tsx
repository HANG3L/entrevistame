"use client";

import { useActionState } from "react";
import { LENGTHS } from "@/lib/interview";
import { LEVELS, type Level } from "@/lib/levels";
import { createInterview, type NewInterviewState } from "./actions";

const optionCard =
  "cursor-pointer rounded-xl border border-zinc-300 p-3 transition has-checked:border-indigo-500 has-checked:bg-indigo-50 dark:border-zinc-700 dark:has-checked:bg-indigo-950/40";

export function NewInterviewForm({ level, puesto }: { level: Level | null; puesto: string }) {
  const [state, formAction, pending] = useActionState<NewInterviewState, FormData>(
    createInterview,
    {},
  );

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-8">
      <label className="flex flex-col gap-2">
        <span className="font-medium">Puesto al que aplicas</span>
        <input
          name="puesto"
          defaultValue={puesto}
          required
          minLength={3}
          maxLength={120}
          placeholder="Ej. Desarrollador Frontend React"
          className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-indigo-500 dark:border-zinc-700"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-medium">
          Descripción de la oferta <span className="font-normal text-zinc-500">(opcional)</span>
        </span>
        <textarea
          name="oferta"
          rows={5}
          maxLength={6000}
          placeholder="Pega aquí la oferta de trabajo. Con ella las preguntas serán más precisas."
          className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-indigo-500 dark:border-zinc-700"
        />
      </label>

      <fieldset>
        <legend className="mb-2 font-medium">Nivel</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {LEVELS.map((l) => (
            <label key={l.value} className={optionCard}>
              <input
                type="radio"
                name="level"
                value={l.value}
                defaultChecked={(level ?? "junior") === l.value}
                className="sr-only"
              />
              <span className="block font-medium">{l.label}</span>
              <span className="text-sm text-zinc-500">{l.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-medium">Duración</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {LENGTHS.map((l) => (
            <label key={l.value} className={optionCard}>
              <input
                type="radio"
                name="length"
                value={l.value}
                defaultChecked={l.value === "normal"}
                className="sr-only"
              />
              <span className="block font-medium">{l.label}</span>
              <span className="text-sm text-zinc-500">
                {l.questions} preguntas · {l.hint}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-indigo-600 px-6 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "La IA está analizando tu CV…" : "Preparar entrevista"}
        </button>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </div>
    </form>
  );
}
