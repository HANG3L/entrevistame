"use client";

import { useActionState, useState } from "react";
import { LEVELS, type Level } from "@/lib/levels";
import { btnPrimary, input, optionCard } from "@/lib/ui";
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
        <span className="font-semibold">¿Cómo te llamas?</span>
        <input name="full_name" defaultValue={fullName} required maxLength={100} className={input} />
      </label>

      {/* Nivel */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">¿Cuánta experiencia tienes?</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {LEVELS.map((l) => (
            <label key={l.value} className={optionCard}>
              <input type="radio" name="level" value={l.value} defaultChecked={level === l.value} className="sr-only" />
              <span className="block font-semibold">{l.label}</span>
              <span className="text-sm text-muted">{l.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* CV */}
      <div className="flex flex-col gap-3">
        <span className="font-semibold">Tu currículum (PDF)</span>

        {cvText && (
          <div className="rounded-3xl border-2 border-ink bg-brand-soft p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm">
                <span className="font-semibold">✓ CV cargado</span>
                <span className="text-muted">
                  {" "}· {words.toLocaleString("es")} palabras
                  {updatedAt && ` · actualizado el ${new Date(updatedAt).toLocaleDateString("es")}`}
                </span>
              </p>
              <button formAction={removeCv} formNoValidate className="text-sm font-medium text-bad hover:underline">
                Quitar CV
              </button>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-muted hover:text-ink">Ver el texto que leerá la IA</summary>
              <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl bg-surface p-3 font-mono text-xs">
                {cvText}
              </pre>
            </details>
          </div>
        )}

        <label className="dots flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-line bg-surface px-4 py-10 text-center transition hover:border-ink">
          <input
            type="file"
            name="cv"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-ink bg-brand text-2xl text-brand-ink shadow-hard-sm" aria-hidden="true">
            ↑
          </span>
          <span className="font-semibold">
            {fileName ?? (cvText ? "Subir otro CV para reemplazarlo" : "Haz clic para elegir tu CV")}
          </span>
          <span className="text-sm text-muted">PDF con texto (no escaneado), máximo 5 MB</span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? (fileName ? "Leyendo tu CV…" : "Guardando…") : "Guardar perfil"}
        </button>
        {state.error && <p className="text-sm text-bad">{state.error}</p>}
        {state.ok && <p className="text-sm font-medium text-ok">{state.message}</p>}
      </div>
    </form>
  );
}
