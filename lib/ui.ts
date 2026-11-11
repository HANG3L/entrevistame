// Clases compartidas para que todas las pantallas se vean igual.

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:translate-y-px disabled:pointer-events-none disabled:opacity-55";

/** Botón principal: lima con borde de tinta y sombra tipo sticker. */
export const btnPrimary = `${btnBase} border-2 border-ink bg-brand px-6 py-2.5 text-brand-ink shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard active:shadow-none`;

/** Botón secundario: contorno. */
export const btnSecondary = `${btnBase} border-2 border-line px-5 py-2.5 hover:border-ink`;

/** Botón discreto para acciones de texto. */
export const btnText = "text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline";

export const card = "rounded-3xl border border-line bg-surface p-5 sm:p-6";

export const input =
  "rounded-xl border-2 border-line bg-surface px-3.5 py-2.5 outline-none transition placeholder:text-muted/70 focus:border-ink";

/** Tarjeta de opción (radio) que se marca al elegirla. */
export const optionCard =
  "cursor-pointer rounded-2xl border-2 border-line bg-surface p-3.5 transition hover:border-muted has-checked:border-ink has-checked:bg-brand-soft has-checked:shadow-hard-sm";

/** Etiqueta pequeña en mayúsculas sobre los títulos. */
export const eyebrow = "font-mono text-xs font-medium uppercase tracking-[0.14em] text-muted";

export const pageTitle = "font-display text-3xl font-extrabold sm:text-4xl";
