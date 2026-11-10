"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// Tipos mínimos de la Web Speech API (TypeScript no los incluye).
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noopSubscribe = () => () => {};

// Código de error de la Web Speech API ("not-allowed", "audio-capture", "network"…) o null.
export type RecognitionError = string | null;

/** Explica cada error del reconocimiento de voz en palabras simples. */
export function recognitionErrorMessage(code: RecognitionError) {
  switch (code) {
    case null:
      return null;
    case "not-allowed":
    case "service-not-allowed":
      return "El navegador bloqueó el micrófono. Haz clic en el candado de la barra de direcciones, permite el micrófono y recarga la página.";
    case "audio-capture":
      return "No se encontró ningún micrófono. Revisa que esté conectado y seleccionado en la configuración de sonido de Windows.";
    case "network":
      return "Este navegador no pudo conectarse al servicio de reconocimiento de voz. Usa Google Chrome o Microsoft Edge (Brave, Opera y los navegadores integrados no lo soportan) y revisa tu internet.";
    case "language-not-supported":
      return "Tu navegador no reconoce voz en español. Prueba con Google Chrome o Microsoft Edge.";
    default:
      return `El reconocimiento de voz falló (${code}). Prueba con Google Chrome o Microsoft Edge.`;
  }
}

export function useSpeechRecognition(lang = "es-MX") {
  const supported = useSyncExternalStore(noopSubscribe, () => getCtor() !== null, () => false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<RecognitionError>(null);

  const recRef = useRef<Recognition | null>(null);
  const keepListening = useRef(false);
  const finalText = useRef("");
  const interimText = useRef("");
  const onStopped = useRef<((text: string) => void) | null>(null);

  const createAndStart = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let partial = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText.current = `${finalText.current} ${r[0].transcript}`.trim();
        else partial += r[0].transcript;
      }
      interimText.current = partial;
      setTranscript(finalText.current);
      setInterim(partial);
    };

    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return; // silencio: seguimos escuchando
      keepListening.current = false;
      console.warn("Reconocimiento de voz:", e.error);
      setError(e.error);
    };

    // Chrome corta el reconocimiento tras un silencio: si seguimos escuchando, lo reiniciamos.
    rec.onend = () => {
      if (keepListening.current) {
        try {
          rec.start();
          return;
        } catch {
          keepListening.current = false;
        }
      }
      recRef.current = null;
      setListening(false);
      const text = `${finalText.current} ${interimText.current}`.trim();
      onStopped.current?.(text);
      onStopped.current = null;
    };

    recRef.current = rec;
    rec.start();
  }, [lang]);

  const start = useCallback(() => {
    if (!getCtor()) return;
    recRef.current?.abort();
    finalText.current = "";
    interimText.current = "";
    setTranscript("");
    setInterim("");
    setError(null);
    keepListening.current = true;
    setListening(true);
    createAndStart();
  }, [createAndStart]);

  /** Deja de escuchar y devuelve todo lo que se transcribió. */
  const stop = useCallback(
    () =>
      new Promise<string>((resolve) => {
        keepListening.current = false;
        const rec = recRef.current;
        if (!rec) return resolve(`${finalText.current} ${interimText.current}`.trim());
        onStopped.current = resolve;
        rec.stop();
      }),
    [],
  );

  /** Deja de escuchar y descarta lo dicho. */
  const abort = useCallback(() => {
    keepListening.current = false;
    onStopped.current = null;
    recRef.current?.abort();
  }, []);

  useEffect(() => abort, [abort]);

  return { supported, listening, transcript, interim, error, start, stop, abort };
}
