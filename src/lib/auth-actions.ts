"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  setupAdminSchema,
} from "@/lib/validations";

export type AuthActionResult = {
  error?: string;
  success?: string;
};

export async function signIn(
  _prevState: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return {
        error:
          "E-mail ainda não confirmado. Verifique sua caixa de entrada ou use Esqueci a senha.",
      };
    }

    return { error: "E-mail ou senha incorretos" };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function requestPasswordReset(
  _prevState: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "E-mail inválido" };
  }

  const supabase = await createClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/login/redefinir-senha`,
  });

  if (error) {
    return { error: "Não foi possível enviar o e-mail. Tente novamente." };
  }

  return {
    success:
      "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.",
  };
}

export async function updatePassword(
  _prevState: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Senha inválida" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Link expirado ou inválido. Solicite uma nova redefinição." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Não foi possível atualizar a senha. Tente novamente." };
  }

  await supabase.auth.signOut({ scope: "global" });
  revalidatePath("/", "layout");
  redirect("/login?reset=success");
}

export async function setupFirstAdmin(
  _prevState: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const parsed = setupAdminSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const adminClient = createAdminClient();
  const { data: existingUsers, error: listError } =
    await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 });

  if (listError) {
    return { error: "Erro ao verificar o sistema. Confira as chaves do Supabase." };
  }

  if ((existingUsers.users?.length ?? 0) > 0) {
    return {
      error: "Já existe uma conta cadastrada. Faça login ou use Esqueci a senha.",
    };
  }

  const { data: authUser, error: createError } =
    await adminClient.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { name: parsed.data.name, role: "admin" },
    });

  if (createError) {
    return {
      error:
        createError.message ||
        "Não foi possível criar a conta. Verifique se o banco foi configurado no Supabase.",
    };
  }

  if (authUser.user) {
    const { error: profileError } = await adminClient.from("profiles").upsert(
      {
        id: authUser.user.id,
        name: parsed.data.name,
        email: parsed.data.email,
        role: "admin",
        active: true,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      return {
        error:
          "Conta criada, mas o perfil falhou. Execute o SQL do banco no Supabase e tente novamente.",
      };
    }
  }

  revalidatePath("/", "layout");
  redirect("/login?setup=success");
}

export async function hasAnyUser(): Promise<boolean> {
  try {
    const adminClient = createAdminClient();
    const result = await Promise.race([
      adminClient.auth.admin.listUsers({ page: 1, perPage: 1 }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 4000)
      ),
    ]);

    const { data, error } = result;
    if (error) return false;
    return (data.users?.length ?? 0) > 0;
  } catch {
    return false;
  }
}
