import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").select("id").limit(1);

    if (error) {
      return NextResponse.json({
        ok: false,
        message:
          "Banco não configurado. Execute supabase/SETUP_COMPLETO.sql no SQL Editor do Supabase.",
      });
    }

    return NextResponse.json({ ok: true, message: "Banco funcionando!" });
  } catch {
    return NextResponse.json({
      ok: false,
      message: "Erro ao conectar com o Supabase.",
    });
  }
}
