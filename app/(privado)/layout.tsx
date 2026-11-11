import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/NavLinks";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getUser } from "@/lib/supabase/server";
import { btnPrimary } from "@/lib/ui";

// Todo lo que está dentro de (privado) exige sesión iniciada.
// La barra se muestra al instante; lo que depende de la sesión llega dentro de <Suspense>.
export default function PrivateLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <Logo href="/dashboard" />
          <div className="order-last w-full sm:order-none sm:w-auto">
            {/* La ruta actual es dato de la URL: se resuelve dentro de Suspense. */}
            <Suspense fallback={<div className="h-8" />}>
              <NavLinks />
            </Suspense>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/nueva" className={`${btnPrimary} hidden px-4 py-1.5 text-sm sm:inline-flex`}>
              + Nueva entrevista
            </Link>
            <ThemeToggle />
            <Suspense fallback={<div className="h-9 w-9 rounded-full bg-surface-2" />}>
              <UserMenu />
            </Suspense>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Suspense fallback={<p className="text-muted">Cargando…</p>}>
          <AuthGate>{children}</AuthGate>
        </Suspense>
      </main>
    </div>
  );
}

async function AuthGate({ children }: { children: React.ReactNode }) {
  if (!(await getUser())) redirect("/");
  return children;
}

async function UserMenu() {
  const user = await getUser();
  if (!user) return null;
  const name = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "";
  const avatar = user.user_metadata?.avatar_url as string | undefined;

  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center rounded-full border-2 border-line p-0.5 transition hover:border-ink [&::-webkit-details-marker]:hidden">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt={name} className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-coral font-bold text-[#17140f]">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </summary>
      <div className="absolute right-0 mt-2 w-60 rounded-2xl border-2 border-ink bg-surface p-2 shadow-hard">
        <p className="truncate px-3 pb-2 pt-1 text-sm font-semibold">{name}</p>
        <Link href="/perfil" className="block rounded-xl px-3 py-2 text-sm hover:bg-surface-2">
          Mi perfil y CV
        </Link>
        <Link href="/nueva" className="block rounded-xl px-3 py-2 text-sm hover:bg-surface-2 sm:hidden">
          Nueva entrevista
        </Link>
        <form action="/auth/signout" method="post">
          <button className="w-full rounded-xl px-3 py-2 text-left text-sm text-bad hover:bg-bad-soft">Cerrar sesión</button>
        </form>
      </div>
    </details>
  );
}
