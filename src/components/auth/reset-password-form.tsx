"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updatePassword, type AuthActionResult } from "@/lib/auth-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Target } from "lucide-react";

const initialState: AuthActionResult = {};

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    updatePassword,
    initialState
  );

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 mb-4 shadow-lg shadow-indigo-600/30">
          <Target className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Nova senha</h1>
        <p className="text-sm text-slate-500 mt-2">
          Defina uma nova senha para sua conta
        </p>
      </div>

      <form
        action={formAction}
        className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50 space-y-5"
      >
        <Input
          label="Nova senha"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          required
        />
        <Input
          label="Confirmar senha"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          required
        />
        <Button type="submit" className="w-full h-11" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar nova senha"}
        </Button>
        <Link
          href="/login"
          className="block text-center text-sm text-slate-500 hover:text-slate-700"
        >
          Voltar ao login
        </Link>
      </form>
    </div>
  );
}
