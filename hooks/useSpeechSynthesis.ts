"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// ---------- Lista de voces en español (se cargan de forma asíncrona) ----------

const EMPTY: SpeechSynthesisVoice[] = [];
let rawCount = -1;
let cachedVoices: SpeechSynthesisVoice[] = EMPTY;

// Prefiere voces naturales (Edge), luego las de Google (Chrome), y acentos latinoamericanos.
function score(v: SpeechSynthesisVoice) {
  let s = 0;
  if (/natural|online/i.test(v.name)) s += 4;
  if (/google/i.test(v.name)) s += 3;
  if (/es-(MX|US|419|HN|CO|AR|CL|PE)/i.test(v.lang)) s += 2;
  if (/es-ES/i.test(v.lang)) s += 1;
  return s;
}

function subscribe(onChange: () => void) {
  if (!("speechSynthesis" in window)) return () => {};
  speechSynthesis.addEventListener("voiceschanged", onChange);
  return () => speechSynthesis.removeEventListener("voiceschanged", onChange);
}

function getVoices() {
  if (!("speechSynthesis" in window)) return EMPTY;
  const all = speechSynthesis.getVoices();
  if (all.length !== rawCount) {
    rawCount = all.length;
    // Algunos navegadores repiten voces con el mismo identificador: nos quedamos con una.
    const seen = new Set<string>();
    cachedVoices = all
      .filter((v) => v.lang.toLowerCase().startsWith("es"))
      .filter((v) => !seen.has(v.voiceURI) && seen.add(v.voiceURI))
      .sort((a, b) => score(b) - score(a));
  }
  return cachedVoices;
}

// Divide el texto en frases: Chrome corta las locuciones largas después de ~15 s.
function chunks(text: string) {
  const sentences = text.match(/[^.!?¿¡]*[¿¡]?[^.!?]*[.!?]+|[^.!?]+$/g) ?? [text];
  const out: string[] = [];
  for (const s of sentences.map((x) => x.trim()).filter(Boolean)) {
    const last = out[out.length - 1];
    if (last && last.length + s.length < 180) out[out.length - 1] = `${last} ${s}`;
    else out.push(s);
  }
  return out;
}

export function useSpeechSynthesis() {
  const voices = useSyncExternalStore(subscribe, getVoices, () => EMPTY);
  const [voiceURI, setVoiceURI] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const pending = useRef<{ resolve: () => void; utterances: SpeechSynthesisUtterance[]; timer?: number } | null>(null);

  const voice = voices.find((v) => v.voiceURI === voiceURI) ?? voices[0] ?? null;

  const finish = useCallback(() => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    window.clearTimeout(p.timer);
    setSpeaking(false);
    p.resolve();
  }, []);

  const cancel = useCallback(() => {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    finish();
  }, [finish]);

  /** Lee el texto en voz alta y se resuelve cuando termina (o si se cancela). */
  const speak = useCallback(
    (text: string) =>
      new Promise<void>((resolve) => {
        if (!("speechSynthesis" in window) || !text.trim()) return resolve();
        speechSynthesis.cancel();
        finish();

        const parts = chunks(text);
        // Se guardan las referencias para que Chrome no las descarte antes de tiempo.
        const utterances = parts.map((part, i) => {
          const u = new SpeechSynthesisUtterance(part);
          u.lang = voice?.lang ?? "es-MX";
          if (voice) u.voice = voice;
          u.rate = 1;
          if (i === parts.length - 1) u.onend = finish;
          u.onerror = finish;
          return u;
        });

        // Respaldo por si el navegador nunca dispara "onend".
        const words = text.split(/\s+/).length;
        const timer = window.setTimeout(finish, (words / 2.2) * 1000 + 4000);

        pending.current = { resolve, utterances, timer };
        setSpeaking(true);
        utterances.forEach((u) => speechSynthesis.speak(u));
      }),
    [voice, finish],
  );

  useEffect(() => cancel, [cancel]);

  return { voices, voice, setVoiceURI, speak, cancel, speaking };
}
