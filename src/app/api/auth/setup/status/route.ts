import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    const admin = createAdminClient();

    const { error: profileError } = await admin
      .from("profiles")
      .select("id")
      .limit(1);

    if (profileError) {
      return NextResponse.json({
        allowed: false,
        reason:
          "Banco não configurado. Execute supabase/SETUP_COMPLETO.sql no Supabase.",
      });
    }

    if (email) {
      const { data: listed, error: listError } =
        await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });

      if (listError) {
        return NextResponse.json({
          allowed: false,
          reason: "Erro ao verificar e-mail. Tente novamente.",
        });
      }

      const alreadyExists = listed.users?.some(
        (u) => u.email?.toLowerCase() === email
      );

      if (alreadyExists) {
        return NextResponse.json({
          allowed: false,
          reason: "Este e-mail já está cadastrado. Faça login.",
        });
      }
    }

    return NextResponse.json({ allowed: true });
  } catch {
    return NextResponse.json({
      allowed: false,
      reason: "Erro ao verificar o sistema.",
    });
  }
}
