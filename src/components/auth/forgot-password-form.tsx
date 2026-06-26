"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  requestPasswordReset,
  type AuthActionResult,
} from "@/lib/auth-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target } from "lucide-react";

const initialState: AuthActionResult = {};

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    initialState
  );

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) toast.success(state.success);
  }, [state.error, state.success]);

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 mb-4 shadow-lg shadow-indigo-600/30">
          <Target className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Esqueci a senha</h1>
        <p className="text-sm text-slate-500 mt-2">
          Informe seu e-mail para receber o link de redefinição
        </p>
      </div>

      <form
        action={formAction}
        className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50 space-y-5"
      >
        <Input
          label="E-mail"
          name="email"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          required
        />
        <Button type="submit" className="w-full h-11" disabled={isPending}>
          {isPending ? "Enviando..." : "Enviar link de recuperação"}
        </Button>
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Link>
      </form>
    </div>
  );
}
