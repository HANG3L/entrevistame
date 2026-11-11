import Link from "next/link";

/** Logotipo: burbuja de diálogo + "entrevista·me" con el "me" resaltado. */
export function Logo({ href = "/", size = "md" }: { href?: string; size?: "md" | "lg" }) {
  const text = size === "lg" ? "text-2xl" : "text-xl";
  const icon = size === "lg" ? 34 : 28;
  return (
    <Link href={href} className="group inline-flex items-center gap-2" aria-label="Entrevistame, inicio">
      <svg width={icon} height={icon} viewBox="0 0 32 32" aria-hidden="true" className="transition group-hover:-rotate-6">
        <path
          d="M6 4h20a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3H14l-6.5 5.2V23H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z"
          fill="var(--brand)"
          stroke="var(--ink)"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <circle cx="11" cy="13.5" r="1.8" fill="#17140f" />
        <circle cx="16" cy="13.5" r="1.8" fill="#17140f" />
        <circle cx="21" cy="13.5" r="1.8" fill="#17140f" />
      </svg>
      <span className={`font-display font-extrabold tracking-tight ${text}`}>
        entrevista<span className="text-coral-text">me</span>
      </span>
    </Link>
  );
}
