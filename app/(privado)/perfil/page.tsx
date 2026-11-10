import { Suspense } from "react";
import { getProfile } from "@/lib/profile";
import { ProfileForm } from "./ProfileForm";

export default function PerfilPage() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Tu perfil</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          La IA usa estos datos y tu CV para preparar preguntas a tu medida.
        </p>
      </div>
      <Suspense fallback={<p className="text-zinc-500">Cargando perfil…</p>}>
        <ProfileLoader />
      </Suspense>
    </section>
  );
}

async function ProfileLoader() {
  const { user, profile } = await getProfile();
  const googleName = (user?.user_metadata?.full_name as string | undefined) ?? "";

  return (
    <ProfileForm
      // Al guardar cambia updated_at y el formulario se reinicia con los datos nuevos.
      key={profile?.updated_at ?? "nuevo"}
      fullName={profile?.full_name ?? googleName}
      level={profile?.level ?? null}
      cvText={profile?.cv_text ?? null}
      updatedAt={profile?.updated_at ?? null}
    />
  );
}
