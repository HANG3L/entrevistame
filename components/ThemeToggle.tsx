"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY as KEY } from "@/lib/theme";

type Pref = "system" | "light" | "dark";
const ORDER: Pref[] = ["system", "light", "dark"];
const LABEL: Record<Pref, string> = { system: "Tema del sistema", light: "Modo claro", dark: "Modo oscuro" };

const listeners = new Set<() => void>();

function readPref(): Pref {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function setPref(p: Pref) {
  try {
    if (p === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, p);
  } catch {}
  (window as unknown as { __applyTheme?: () => void }).__applyTheme?.();
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const pref = useSyncExternalStore(subscribe, readPref, () => "system" as Pref);
  const next = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];

  return (
    <button
      type="button"
      onClick={() => setPref(next)}
      title={`${LABEL[pref]} · cambiar a ${LABEL[next].toLowerCase()}`}
      aria-label={`${LABEL[pref]}. Cambiar a ${LABEL[next].toLowerCase()}`}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-line text-ink transition hover:border-ink ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {pref === "light" && (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        )}
        {pref === "dark" && <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />}
        {pref === "system" && (
          <>
            <rect x="3" y="4" width="18" height="12" rx="2" />
            <path d="M8 20h8M12 16v4" />
          </>
        )}
      </svg>
    </button>
  );
}
