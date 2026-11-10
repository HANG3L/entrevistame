import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";

// Recibe la última respuesta y decide si repreguntar o seguir (fase 4).
export async function POST() {
  const { error } = await requireUser();
  if (error) return error;
  return NextResponse.json({ error: "Todavía no implementado" }, { status: 501 });
}
