import { Placeholder } from "@/components/Placeholder";

export default async function EntrevistaPage(props: PageProps<"/entrevista/[id]">) {
  const { id } = await props.params;
  return (
    <Placeholder
      title="Sala de entrevista"
      text={`Entrevista ${id}: la IA te hará preguntas en voz alta y tú responderás hablando.`}
      phase="fases 3 y 4"
    />
  );
}
