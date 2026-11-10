"use client";

import { useActionState, useState } from "react";
import { LEVELS, type Level } from "@/lib/levels";
import { removeCv, saveProfile, type ProfileState } from "./actions";

type Props = {
  fullName: string;
  level: Level | null;
  cvText: string | null;
  updatedAt: string | null;
};

export function ProfileForm({ fullName, level, cvText, updatedAt }: Props) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(saveProfile, {});
  const [fileName, setFileName] = useState<string | null>(null);

  const words = cvText ? cvText.split(/\s+/).filter(Boolean).length : 0;

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-8">
      {/* Nombre */}
      <label className="flex flex-col gap-2">
        <span className="font-medium">Nombre</span>
        <input
          name="full_name"
          defaultValue={fullName}
          required
          maxLength={100}
          className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-indigo-500 dark:border-zinc-700"
        />
      </label>

      {/* Nivel */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-medium">Nivel de experiencia</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {LEVELS.map((l) => (
            <label
              key={l.value}
              className="cursor-pointer rounded-xl border border-zinc-300 p-3 transition has-checked:border-indigo-500 has-checked:bg-indigo-50 dark:border-zinc-700 dark:has-checked:bg-indigo-950/40"
            >
              <input
                type="radio"
                name="level"
                value={l.value}
                defaultChecked={level === l.value}
                className="sr-only"
              />
              <span className="block font-medium">{l.label}</span>
              <span className="text-sm text-zinc-500">{l.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* CV */}
      <div className="flex flex-col gap-3">
        <span className="font-medium">Currículum (PDF)</span>

        {cvText && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm">
                <span className="font-medium text-emerald-700 dark:text-emerald-400">CV cargado</span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {" "}· {words.toLocaleString("es")} palabras
                  {updatedAt && ` · actualizado el ${new Date(updatedAt).toLocaleDateString("es")}`}
                </span>
              </p>
              <button
                formAction={removeCv}
                formNoValidate
                className="text-sm text-red-600 hover:underline"
              >
                Quitar CV
              </button>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-zinc-600 dark:text-zinc-400">
                Ver el texto que leerá la IA
              </summary>
              <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-xs dark:bg-zinc-900">
                {cvText}
              </pre>
            </details>
          </div>
        )}

        <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed border-zinc-300 px-4 py-8 text-center transition hover:border-indigo-400 dark:border-zinc-700">
          <input
            type="file"
            name="cv"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
          <span className="font-medium">
            {fileName ?? (cvText ? "Subir otro CV para reemplazarlo" : "Haz clic para elegir tu CV")}
          </span>
          <span className="text-sm text-zinc-500">PDF con texto, máximo 5 MB</span>
        </label>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-indigo-600 px-6 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? (fileName ? "Leyendo tu CV…" : "Guardando…") : "Guardar perfil"}
        </button>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.ok && <p className="text-sm text-emerald-600">{state.message}</p>}
      </div>
    </form>
  );
}
