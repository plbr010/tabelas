"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { setupAdminSchema, type SetupAdminFormData } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner, LoadingOverlay } from "@/components/ui/spinner";
import { Target, AlertCircle } from "lucide-react";

export function SetupAdminForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dbOk, setDbOk] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupAdminFormData>({
    resolver: zodResolver(setupAdminSchema),
  });

  useEffect(() => {
    fetch("/api/auth/health")
      .then((r) => r.json())
      .then((data) => setDbOk(data.ok === true))
      .catch(() => setDbOk(false));
  }, []);

  async function onSubmit(data: SetupAdminFormData) {
    setLoading(true);

    try {
      const email = data.email.trim().toLowerCase();

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(
          typeof result.error === "string"
            ? result.error
            : "Não foi possível criar a conta."
        );
        return;
      }

      const supabase = createClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: data.password,
      });

      if (loginError) {
        toast.success("Conta criada! Faça login.");
        router.push("/login?setup=success");
        return;
      }

      toast.success("Conta criada com sucesso!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {loading && <LoadingOverlay message="Criando sua conta..." />}

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 mb-4 shadow-lg shadow-indigo-600/30">
            <Target className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Criar conta</h1>
          <p className="text-sm text-slate-500 mt-2">
            Preencha seus dados para se cadastrar
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50 space-y-5">
          {dbOk === false && (
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>
                O banco ainda não está configurado. Execute{" "}
                <strong>supabase/SETUP_COMPLETO.sql</strong> no Supabase.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Nome"
              type="text"
              placeholder="Seu nome"
              autoComplete="name"
              error={errors.name?.message}
              disabled={loading}
              {...register("name")}
            />
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              error={errors.email?.message}
              disabled={loading}
              {...register("email")}
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.password?.message}
              disabled={loading}
              {...register("password")}
            />
            <Input
              label="Confirmar senha"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              disabled={loading}
              {...register("confirmPassword")}
            />
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner
                    size="sm"
                    className="border-white border-t-transparent"
                  />
                  Criando...
                </span>
              ) : (
                "Criar conta"
              )}
            </Button>
          </form>

          <Link
            href="/login"
            className="block text-center text-sm text-slate-500 hover:text-slate-700"
          >
            Já tenho uma conta
          </Link>
        </div>
      </div>
    </>
  );
}
