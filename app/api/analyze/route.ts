import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";

// Recibe CV + puesto y devuelve el plan de entrevista (fase 2).
export async function POST() {
  const { error } = await requireUser();
  if (error) return error;
  return NextResponse.json({ error: "Todavía no implementado" }, { status: 501 });
}
