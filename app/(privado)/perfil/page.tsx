import { Suspense } from "react";
import { getProfile } from "@/lib/profile";
import { eyebrow, pageTitle } from "@/lib/ui";
import { ProfileForm } from "./ProfileForm";

export default function PerfilPage() {
  return (
    <section className="flex flex-col gap-8">
      <div>
        <p className={eyebrow}>Paso 1</p>
        <h1 className={pageTitle}>Tu perfil</h1>
        <p className="mt-1 max-w-xl text-muted">
          La IA usa tu CV para preguntarte por tus proyectos, prácticas y experiencia reales. No inventa nada.
        </p>
      </div>
      <Suspense fallback={<p className="text-muted">Cargando perfil…</p>}>
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
