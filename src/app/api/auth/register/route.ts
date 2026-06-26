import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUserRole } from "@/lib/constants";
import { setupAdminSchema } from "@/lib/validations";

async function findUserByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string
) {
  const { data: listed } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  return listed.users?.find((u) => u.email?.toLowerCase() === email) ?? null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = setupAdminSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const name = parsed.data.name.trim();
    const role = resolveUserRole(email);
    const admin = createAdminClient();

    const existingUser = await findUserByEmail(admin, email);
    let userId: string;

    if (existingUser) {
      const { error: updateError } = await admin.auth.admin.updateUserById(
        existingUser.id,
        {
          password: parsed.data.password,
          email_confirm: true,
          user_metadata: { name, role },
        }
      );

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }

      userId = existingUser.id;
    } else {
      const { data: authUser, error: createError } =
        await admin.auth.admin.createUser({
          email,
          password: parsed.data.password,
          email_confirm: true,
          user_metadata: { name, role },
        });

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }

      if (!authUser.user) {
        return NextResponse.json(
          { error: "Não foi possível criar a conta." },
          { status: 500 }
        );
      }

      userId = authUser.user.id;
    }

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: userId,
        name,
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

    return NextResponse.json({ success: true, role });
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
