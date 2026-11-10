import { Placeholder } from "@/components/Placeholder";

export default async function ResultadoPage(props: PageProps<"/resultado/[id]">) {
  const { id } = await props.params;
  return (
    <Placeholder
      title="Tu feedback"
      text={`Resultado de la entrevista ${id}: puntajes, fortalezas y áreas de mejora.`}
      phase="fase 5"
    />
  );
}
