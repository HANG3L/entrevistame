import Link from "next/link";
import { Placeholder } from "@/components/Placeholder";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <Placeholder
        title="Tus entrevistas"
        text="Aquí verás el historial de tus prácticas y sus puntajes."
        phase="fase 6"
      />
      <Link
        href="/nueva"
        className="w-fit rounded-full bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
      >
        Nueva entrevista
      </Link>
    </div>
  );
}
