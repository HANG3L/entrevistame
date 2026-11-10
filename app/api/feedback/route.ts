import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";

// Recibe la transcripción completa y devuelve la evaluación (fase 5).
export async function POST() {
  const { error } = await requireUser();
  if (error) return error;
  return NextResponse.json({ error: "Todavía no implementado" }, { status: 501 });
}
