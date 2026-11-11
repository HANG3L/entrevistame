"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Mis entrevistas", match: ["/dashboard", "/entrevista", "/resultado"] },
  { href: "/perfil", label: "Perfil", match: ["/perfil"] },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-1">
      {LINKS.map((l) => {
        const active = l.match.some((m) => pathname.startsWith(m));
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              active ? "bg-ink text-bg" : "text-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </div>
  );
}
