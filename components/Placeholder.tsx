export function Placeholder({ title, text, phase }: { title: string; text: string; phase: string }) {
  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-zinc-600 dark:text-zinc-400">{text}</p>
      <p className="mt-4 w-fit rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
        En construcción: {phase}
      </p>
    </section>
  );
}
