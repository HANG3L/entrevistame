"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMicLevel } from "@/hooks/useMicLevel";
import { recognitionErrorMessage, useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import type { TurnResponse } from "@/lib/interview";

type Phase = "intro" | "connecting" | "ai" | "listening" | "thinking" | "retry" | "done";
type Line = { who: "ia" | "tu"; text: string };

type Props = {
  interviewId: string;
  interviewer: string;
  puesto: string;
  candidateName: string;
  avatarUrl: string | null;
  totalQuestions: number;
  resuming: boolean;
};

const btn = "rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50";
const btnGhost = `${btn} bg-surface-2 text-ink hover:bg-line`;
const btnGo = `${btn} border-2 border-ink bg-brand text-brand-ink shadow-hard-sm hover:-translate-y-0.5 active:translate-y-px active:shadow-none`;

export function InterviewRoom(props: Props) {
  const { interviewId, interviewer, puesto, candidateName, avatarUrl, totalQuestions, resuming } = props;
  const tts = useSpeechSynthesis();
  const stt = useSpeechRecognition("es-MX");

  const [phase, setPhase] = useState<Phase>("intro");
  const [current, setCurrent] = useState<TurnResponse | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingAnswer, setPendingAnswer] = useState<string | null>(null);
  const [typingChoice, setTypingChoice] = useState(false);
  const [typed, setTyped] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);

  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [camStream, setCamStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const level = useMicLevel(micStream);

  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const alive = useRef(true);

  const [testingMic, setTestingMic] = useState(false);

  // Si el reconocimiento de voz falla, se puede seguir respondiendo por escrito.
  const typingMode = typingChoice || !stt.supported || stt.error !== null;
  const sttErrorMessage = recognitionErrorMessage(stt.error);

  // ---------- Efectos ----------

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (!startedAt || phase === "done") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt, phase]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = camStream;
  }, [camStream]);

  // Libera micrófono y cámara al salir de la sala.
  useEffect(() => () => micStream?.getTracks().forEach((t) => t.stop()), [micStream]);
  useEffect(() => () => camStream?.getTracks().forEach((t) => t.stop()), [camStream]);

  // ---------- Flujo de la entrevista ----------

  async function callTurn(answer?: string): Promise<TurnResponse> {
    const res = await fetch("/api/turn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interviewId, answer }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Se perdió la conexión con el servidor.");
    return data as TurnResponse;
  }

  function listen() {
    setNotice(null);
    setTyped("");
    setPhase("listening");
    if (!typingMode) stt.start();
  }

  async function aiSays(turn: TurnResponse) {
    setCurrent(turn);
    setLines((l) => [...l, { who: "ia", text: turn.say }]);
    setPhase("ai");
    await tts.speak(turn.say);
    if (!alive.current) return;
    if (turn.done) {
      setPhase("done");
      micStream?.getTracks().forEach((t) => t.stop());
      setMicStream(null);
      return;
    }
    listen();
  }

  /** Pide el micrófono y devuelve false (mostrando el motivo) si no se pudo. */
  async function ensureMic() {
    if (micStream) return true;
    try {
      setMicStream(await navigator.mediaDevices.getUserMedia({ audio: true }));
      return true;
    } catch (e) {
      const name = (e as DOMException).name;
      setError(
        name === "NotFoundError"
          ? "No se encontró ningún micrófono. Revisa que esté conectado y seleccionado en Windows."
          : name === "NotReadableError"
            ? "Otra aplicación está usando el micrófono (Zoom, Teams, Discord…). Ciérrala y vuelve a intentar."
            : "El navegador bloqueó el micrófono. Haz clic en el candado de la barra de direcciones, permite el micrófono y recarga la página.",
      );
      return false;
    }
  }

  async function toggleMicTest() {
    if (testingMic) {
      stt.abort();
      setTestingMic(false);
      return;
    }
    setError(null);
    if (!(await ensureMic())) return;
    setTestingMic(true);
    if (stt.supported) stt.start();
  }

  async function join() {
    setPhase("connecting");
    setError(null);
    if (testingMic) {
      stt.abort();
      setTestingMic(false);
    }
    if (!typingMode && !(await ensureMic())) {
      setPhase("intro");
      return;
    }
    try {
      const turn = await callTurn();
      setStartedAt(Date.now());
      setNow(Date.now());
      await aiSays(turn);
    } catch (e) {
      setError((e as Error).message);
      setPhase("intro");
    }
  }

  async function sendAnswer(text: string) {
    setPhase("thinking");
    setError(null);
    try {
      const turn = await callTurn(text);
      setPendingAnswer(null);
      await aiSays(turn);
    } catch (e) {
      setPendingAnswer(text);
      setError((e as Error).message);
      setPhase("retry");
    }
  }

  async function finishAnswer() {
    const text = typingMode ? typed.trim() : await stt.stop();
    if (text.split(/\s+/).filter(Boolean).length < 2) {
      setNotice(typingMode ? "Escribe tu respuesta antes de enviarla." : "No alcancé a escucharte. Intenta de nuevo.");
      listen();
      return;
    }
    setLines((l) => [...l, { who: "tu", text }]);
    await sendAnswer(text);
  }

  async function repeat() {
    if (!current) return;
    stt.abort();
    setPhase("ai");
    await tts.speak(current.say);
    if (alive.current) listen();
  }

  function switchToTyping() {
    stt.abort();
    setTypingChoice(true);
    setNotice(null);
  }

  async function toggleCamera() {
    if (camStream) {
      camStream.getTracks().forEach((t) => t.stop());
      setCamStream(null);
      return;
    }
    try {
      setCamStream(await navigator.mediaDevices.getUserMedia({ video: true }));
    } catch {
      setNotice("No se pudo abrir la cámara. Puedes seguir sin ella.");
    }
  }

  // ---------- Vista ----------

  const elapsed = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
  const clock = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const questionLabel = current?.questionNumber
    ? `Pregunta ${current.questionNumber} de ${current.totalQuestions}`
    : `${totalQuestions} preguntas`;
  const initial = (name: string) => name.trim().charAt(0).toUpperCase() || "?";
  const inMeeting = phase !== "intro" && phase !== "connecting";

  return (
    // La sala siempre es oscura, como una videollamada, sin importar el tema elegido.
    <div data-theme="dark" className="flex flex-col gap-4 rounded-[2rem] bg-bg p-3 text-ink sm:p-5">
      {/* Barra superior */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-sm">
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold">{puesto}</p>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">{questionLabel}</p>
        </div>
        {inMeeting && phase !== "done" && (
          <span className="flex items-center gap-2 rounded-full bg-surface px-3 py-1 font-mono tabular-nums">
            <span className="h-2 w-2 animate-pulse rounded-full bg-coral" /> {clock}
          </span>
        )}
      </div>

      {/* Participantes */}
      <div className="grid gap-3 md:grid-cols-2">
        <Tile label={`${interviewer} · Entrevistador(a)`} active={phase === "ai"} tone="coral">
          <div className="relative flex items-center justify-center">
            {phase === "ai" && <span className="absolute h-28 w-28 animate-ping rounded-full bg-coral/30" />}
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-ink bg-coral font-display text-5xl font-extrabold text-[#17140f]">
              {initial(interviewer)}
            </div>
          </div>
          {phase === "thinking" && <p className="mt-4 animate-pulse font-mono text-xs uppercase tracking-widest text-muted">Pensando…</p>}
        </Tile>

        <Tile label={`${candidateName} (tú)`} active={phase === "listening" && !typingMode} tone="brand">
          {camStream ? (
            <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
          ) : (
            <div
              className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-surface-2 font-display text-5xl font-extrabold transition-shadow"
              style={{ boxShadow: phase === "listening" ? `0 0 0 ${4 + level * 18}px rgb(200 241 53 / 0.35)` : undefined }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                initial(candidateName)
              )}
            </div>
          )}
        </Tile>
      </div>

      {/* Subtítulos */}
      {inMeeting && (
        <div className="min-h-20 rounded-2xl bg-surface px-4 py-3 text-center">
          {phase === "listening" && !typingMode ? (
            <p className="text-lg">
              {stt.transcript}{" "}
              <span className="text-muted">{stt.interim || (!stt.transcript && "Te escucho… responde cuando quieras.")}</span>
            </p>
          ) : (
            <p className="text-lg">{current?.say}</p>
          )}
        </div>
      )}

      {/* Respuesta escrita (si no hay reconocimiento de voz o el usuario lo prefiere) */}
      {phase === "listening" && typingMode && (
        <textarea
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          rows={4}
          autoFocus
          placeholder="Escribe tu respuesta…"
          className="rounded-2xl border-2 border-line bg-surface px-4 py-3 outline-none focus:border-brand"
        />
      )}

      {notice && <p className="text-center text-sm text-warn">{notice}</p>}
      {error && <p className="text-center text-sm text-bad">{error}</p>}
      {sttErrorMessage && (
        <p className="text-center text-sm text-warn">
          {sttErrorMessage} Mientras tanto puedes responder escribiendo.
        </p>
      )}

      {/* Controles */}
      {inMeeting && phase !== "done" && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {phase === "listening" && (
            <button onClick={finishAnswer} className={`${btnGo} px-6`}>
              {typingMode ? "Enviar respuesta" : "Terminé de responder"}
            </button>
          )}
          {phase === "retry" && pendingAnswer && (
            <button onClick={() => sendAnswer(pendingAnswer)} className={btnGo}>
              Reintentar
            </button>
          )}
          <button onClick={repeat} disabled={phase !== "listening"} className={btnGhost}>
            Repetir pregunta
          </button>
          {!typingMode && phase === "listening" && (
            <button onClick={switchToTyping} className={btnGhost}>
              Prefiero escribir
            </button>
          )}
          <button onClick={toggleCamera} className={btnGhost}>
            {camStream ? "Apagar cámara" : "Encender cámara"}
          </button>
          <button onClick={() => setShowTranscript((s) => !s)} className={btnGhost}>
            {showTranscript ? "Ocultar transcripción" : "Transcripción"}
          </button>
          <Link href={`/entrevista/${interviewId}`} className={`${btn} bg-bad-soft text-bad hover:bg-bad hover:text-[#17140f]`}>
            Salir
          </Link>
        </div>
      )}

      {/* Transcripción completa */}
      {showTranscript && lines.length > 0 && (
        <ol className="flex max-h-72 flex-col gap-2 overflow-auto rounded-2xl bg-surface p-4 text-sm">
          {lines.map((l, i) => (
            <li key={i} className={l.who === "tu" ? "text-brand-text" : "text-ink"}>
              <span className="font-semibold">{l.who === "tu" ? "Tú" : interviewer}:</span> {l.text}
            </li>
          ))}
        </ol>
      )}

      {/* Antes de entrar */}
      {(phase === "intro" || phase === "connecting") && (
        <div className="mx-auto flex w-full max-w-lg flex-col gap-4 rounded-3xl bg-surface p-5 sm:p-6">
          <h2 className="text-2xl font-extrabold">
            {resuming ? "Continúa donde te quedaste" : `${interviewer} te está esperando`}
          </h2>
          {!stt.supported && (
            <p className="text-sm text-warn">
              Tu navegador no reconoce voz. Puedes responder escribiendo, o abrir la app en Chrome o Edge para hablar.
            </p>
          )}
          {tts.voices.length > 0 ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Voz del entrevistador</span>
              <div className="flex gap-2">
                <select
                  value={tts.voice?.voiceURI ?? ""}
                  onChange={(e) => tts.setVoiceURI(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl bg-surface-2 px-3 py-2"
                >
                  {tts.voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => tts.speak(`Hola, soy ${interviewer}. Así sonará mi voz durante la entrevista.`)}
                  className={btnGhost}
                >
                  Probar
                </button>
              </div>
            </label>
          ) : (
            <p className="text-sm text-warn">No encontramos voces en español en tu navegador; las preguntas se verán en pantalla.</p>
          )}
          {stt.supported && (
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted">Micrófono</span>
                <button type="button" onClick={toggleMicTest} className={btnGhost}>
                  {testingMic ? "Detener prueba" : "Probar micrófono"}
                </button>
              </div>
              {testingMic && (
                <div className="flex flex-col gap-2 rounded-2xl bg-surface-2 p-3">
                  <div className="h-2 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-brand transition-[width] duration-75"
                      style={{ width: `${Math.round(level * 100)}%` }}
                    />
                  </div>
                  <p className={stt.transcript || stt.interim ? "" : "text-muted"}>
                    {stt.transcript || stt.interim
                      ? `${stt.transcript} ${stt.interim}`
                      : "Di algo como “Hola, estoy listo para la entrevista”…"}
                  </p>
                  {!stt.listening && !stt.error && (
                    <p className="text-warn">El reconocimiento se detuvo. Pulsa “Detener prueba” y vuelve a probar.</p>
                  )}
                </div>
              )}
              {sttErrorMessage && <p className="text-warn">{sttErrorMessage}</p>}
            </div>
          )}
          <ul className="list-disc pl-5 text-sm text-muted">
            <li>Cuando termines cada respuesta, pulsa “Terminé de responder”.</li>
            <li>Tu progreso se guarda: si sales, puedes continuar después.</li>
          </ul>
          <button
            onClick={join}
            disabled={phase === "connecting"}
            className={`${btnGo} py-3 text-base`}
          >
            {phase === "connecting" ? "Conectando…" : resuming ? "Continuar entrevista" : "Unirme a la entrevista"}
          </button>
        </div>
      )}

      {/* Final */}
      {phase === "done" && (
        <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 rounded-3xl bg-surface p-6 text-center">
          <h2 className="text-3xl font-extrabold">¡Lo lograste! 🎉</h2>
          <p className="text-sm text-muted">Duraste {clock}. Ahora la IA revisará cada respuesta.</p>
          <Link href={`/resultado/${interviewId}`} className={`${btnGo} px-6 py-3 text-base`}>
            Ver mi feedback
          </Link>
        </div>
      )}
    </div>
  );
}

function Tile({
  label,
  active,
  tone,
  children,
}: {
  label: string;
  active: boolean;
  tone: "coral" | "brand";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`dots relative flex aspect-video flex-col items-center justify-center overflow-hidden rounded-3xl bg-surface ring-2 transition ${
        active ? (tone === "coral" ? "ring-coral" : "ring-brand") : "ring-transparent"
      }`}
    >
      {children}
      <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-0.5 font-mono text-xs text-[#f4efe5]">{label}</span>
    </div>
  );
}
