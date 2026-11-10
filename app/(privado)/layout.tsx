import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUser } from "@/lib/supabase/server";

// Todo lo que está dentro de (privado) exige sesión iniciada.
// La barra se muestra al instante; lo que depende de la sesión llega dentro de <Suspense>.
export default function PrivateLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
          <Link href="/dashboard" className="font-bold">
            Entrevistame
          </Link>
          <Link href="/perfil" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
            Perfil
          </Link>
          <Link href="/nueva" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
            Nueva entrevista
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <Suspense fallback={<div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />}>
              <UserMenu />
            </Suspense>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Suspense fallback={<p className="text-zinc-500">Cargando…</p>}>
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
  const name = (user.user_metadata?.full_name as string | undefined) ?? user.email;
  const avatar = user.user_metadata?.avatar_url as string | undefined;

  return (
    <>
      {avatar && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
      )}
      <span className="hidden text-sm sm:inline">{name}</span>
      <form action="/auth/signout" method="post">
        <button className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">Salir</button>
      </form>
    </>
  );
}
