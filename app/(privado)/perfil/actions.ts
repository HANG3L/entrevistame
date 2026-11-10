"use server";

import { refresh } from "next/cache";
import { extractText } from "unpdf";
import { LEVELS } from "@/lib/levels";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { ok?: boolean; error?: string; message?: string };

const MAX_CV_BYTES = 5 * 1024 * 1024;
const MAX_CV_CHARS = 20_000; // suficiente para cualquier CV y cuida los tokens de la IA
const MIN_CV_CHARS = 200;

function cleanText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function saveProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const fullName = String(formData.get("full_name") ?? "").trim().slice(0, 100);
  const levelRaw = String(formData.get("level") ?? "");
  const level = LEVELS.some((l) => l.value === levelRaw) ? levelRaw : null;

  if (!fullName) return { error: "Escribe tu nombre." };

  const update: Record<string, unknown> = {
    full_name: fullName,
    level,
    updated_at: new Date().toISOString(),
  };

  const file = formData.get("cv");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_CV_BYTES) return { error: "El PDF pesa más de 5 MB." };

    const bytes = new Uint8Array(await file.arrayBuffer());
    const isPdf = new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-";
    if (!isPdf) return { error: "El archivo debe ser un PDF." };

    let text: string;
    try {
      // pdf.js puede consumir el buffer, por eso le pasamos una copia.
      const result = await extractText(bytes.slice(), { mergePages: true });
      text = cleanText(result.text);
    } catch (e) {
      console.error("Error leyendo el PDF:", e);
      return { error: "No pudimos leer el PDF. Prueba exportarlo de nuevo desde Word o Google Docs." };
    }

    if (text.length < MIN_CV_CHARS) {
      return {
        error:
          "El PDF casi no tiene texto. Parece una imagen escaneada; súbelo como PDF de texto (exportado desde Word o Google Docs).",
      };
    }

    const path = `${user.id}/cv.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(path, bytes, { contentType: "application/pdf", upsert: true });
    if (uploadError) {
      console.error("Error subiendo el CV:", uploadError.message);
      return {
        error: "No se pudo guardar el archivo. Revisa que ejecutaste supabase/schema.sql en Supabase.",
      };
    }

    update.cv_text = text.slice(0, MAX_CV_CHARS);
    update.cv_path = path;
  }

  const { error } = await supabase.from("profiles").upsert({ id: user.id, ...update });
  if (error) {
    console.error("Error guardando el perfil:", error.message);
    return { error: "No se pudo guardar el perfil. Revisa que ejecutaste supabase/schema.sql." };
  }

  refresh();
  return { ok: true, message: "Perfil guardado." };
}

export async function removeCv() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  await supabase.storage.from("cvs").remove([`${auth.user.id}/cv.pdf`]);
  await supabase
    .from("profiles")
    .update({ cv_text: null, cv_path: null, updated_at: new Date().toISOString() })
    .eq("id", auth.user.id);

  refresh();
}
