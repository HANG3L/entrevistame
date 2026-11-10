import "server-only";
import { GoogleGenAI } from "@google/genai";

// Modelo rápido con capa gratuita. Se puede cambiar con GEMINI_MODEL en .env.local.
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

let client: GoogleGenAI | null = null;

// Cliente de Gemini. Solo se usa en el servidor para no exponer la clave.
export function getGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Falta GEMINI_API_KEY en .env.local");
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

// Pide a Gemini una respuesta en JSON y la devuelve ya parseada.
export async function generateJson<T>(prompt: string, schema?: unknown): Promise<T> {
  const res = await getGemini().models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      ...(schema ? { responseJsonSchema: schema } : {}),
    },
  });
  return JSON.parse(res.text ?? "{}") as T;
}
