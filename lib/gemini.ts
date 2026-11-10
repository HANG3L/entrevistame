import "server-only";
import { GoogleGenAI } from "@google/genai";

// Modelo principal (capa gratuita) y respaldos si está saturado o se llegó al límite.
// Se puede cambiar el principal con GEMINI_MODEL en .env.local.
const MODELS = [
  process.env.GEMINI_MODEL ?? "gemini-3.5-flash",
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite",
].filter((m, i, all) => all.indexOf(m) === i);

let client: GoogleGenAI | null = null;

// Cliente de Gemini. Solo se usa en el servidor para no exponer la clave.
export function getGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Falta GEMINI_API_KEY en .env.local");
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly userMessage: string,
  ) {
    super(message);
  }
}

function statusOf(e: unknown) {
  return typeof e === "object" && e && "status" in e ? Number((e as { status: unknown }).status) : 0;
}

type JsonOptions = {
  system?: string;
  schema?: unknown;
  temperature?: number;
};

// Pide a Gemini una respuesta en JSON y la devuelve ya parseada.
export async function generateJson<T>(prompt: string, opts: JsonOptions = {}): Promise<T> {
  let lastError: unknown;

  for (const model of MODELS) {
    try {
      const res = await getGemini().models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: opts.system,
          temperature: opts.temperature,
          responseMimeType: "application/json",
          ...(opts.schema ? { responseJsonSchema: opts.schema } : {}),
        },
      });
      return JSON.parse(res.text ?? "{}") as T;
    } catch (e) {
      lastError = e;
      const status = statusOf(e);
      // 429 = límite gratuito, 5xx = saturado: probamos con el siguiente modelo.
      if (status === 429 || status >= 500) {
        console.warn(`Gemini ${model} respondió ${status}, probando otro modelo…`);
        continue;
      }
      break;
    }
  }

  console.error("Error de Gemini:", lastError);
  const status = statusOf(lastError);
  throw new GeminiError(
    String(lastError),
    status === 429
      ? "Llegaste al límite gratuito de la IA. Espera un minuto y vuelve a intentar."
      : status >= 500
        ? "La IA está saturada en este momento. Intenta de nuevo en unos segundos."
        : "La IA no pudo responder. Revisa tu GEMINI_API_KEY e intenta de nuevo.",
  );
}
