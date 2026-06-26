"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { loginSchema, type LoginFormData } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner, LoadingOverlay } from "@/components/ui/spinner";
import { Target } from "lucide-react";
import { useEffect } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      toast.success("Senha redefinida! Faça login com a nova senha.");
    }
    if (searchParams.get("setup") === "success") {
      toast.success("Conta criada! Faça login para entrar.");
    }
    if (searchParams.get("error") === "auth") {
      toast.error("Link inválido ou expirado.");
    }
    if (searchParams.get("error") === "profile") {
      toast.error(
        "Perfil não encontrado. Execute o SQL do banco no Supabase ou crie sua conta."
      );
    }
  }, [searchParams]);

  async function onSubmit(data: LoginFormData) {
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          toast.error("E-mail não confirmado. Crie a conta novamente em /setup.");
        } else if (error.message.toLowerCase().includes("invalid")) {
          toast.error(
            "E-mail ou senha incorretos. Tente Esqueci a senha ou crie a conta de novo."
          );
        } else {
          toast.error("E-mail ou senha incorretos");
        }
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Erro ao entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {loading && <LoadingOverlay message="Entrando no sistema..." />}

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 mb-4 shadow-lg shadow-indigo-600/30">
            <Target className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Portal de Indicações</h1>
          <p className="text-sm text-slate-500 mt-2">
            Faça login para acessar o sistema
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50 space-y-5"
        >
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            error={errors.email?.message}
            disabled={loading}
            {...register("email")}
          />
          <div className="space-y-2">
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              disabled={loading}
              {...register("password")}
            />
            <div className="flex justify-end">
              <Link
                href="/login/esqueci-senha"
                className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Esqueci a senha
              </Link>
            </div>
          </div>
          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" className="border-white border-t-transparent" />
                Entrando...
              </span>
            ) : (
              "Entrar"
            )}
          </Button>
          <p className="text-center text-sm text-slate-500">
            Primeira vez?{" "}
            <Link
              href="/setup"
              className="text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Criar conta
            </Link>
          </p>
        </form>
      </div>
    </>
  );
}
