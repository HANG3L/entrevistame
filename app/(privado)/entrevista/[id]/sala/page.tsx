import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getInterview } from "@/lib/interview-data";
import { getProfile } from "@/lib/profile";
import { InterviewRoom } from "./InterviewRoom";

export default function SalaPage(props: PageProps<"/entrevista/[id]/sala">) {
  return (
    <Suspense fallback={<p className="text-muted">Preparando la sala…</p>}>
      <RoomLoader params={props.params} />
    </Suspense>
  );
}

async function RoomLoader({ params }: { params: PageProps<"/entrevista/[id]/sala">["params"] }) {
  const { id } = await params;
  const [interview, { user, profile }] = await Promise.all([getInterview(id), getProfile()]);
  if (!interview?.plan) notFound();
  if (interview.status === "terminada") redirect(`/resultado/${id}`);

  const name =
    profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? "Candidato";

  return (
    <InterviewRoom
      interviewId={interview.id}
      interviewer={interview.plan.entrevistador}
      puesto={interview.plan.puesto}
      candidateName={name.split(" ")[0]}
      avatarUrl={profile?.avatar_url ?? null}
      totalQuestions={interview.plan.preguntas.length}
      resuming={interview.status === "en_curso"}
    />
  );
}
