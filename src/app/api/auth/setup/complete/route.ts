import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolveUserRole } from "@/lib/constants";
import { z } from "zod";

const completeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sessão inválida. Verifique o código novamente." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = completeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const role = resolveUserRole(email);

    const adminClient = createAdminClient();

    const { error: profileError } = await adminClient.from("profiles").upsert(
      {
        id: user.id,
        name: parsed.data.name,
        email,
        role,
        active: true,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      return NextResponse.json(
        { error: "Erro ao salvar perfil. Verifique o banco de dados." },
        { status: 500 }
      );
    }

    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: { name: parsed.data.name, role },
    });

    return NextResponse.json({ success: true, role });
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
