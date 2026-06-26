"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { settingsSchema } from "@/lib/validations";
import type { z } from "zod";
import { updateSettings } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SystemSettings } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

interface SettingsFormProps {
  settings: SystemSettings;
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<
    z.input<typeof settingsSchema>,
    unknown,
    z.output<typeof settingsSchema>
  >({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      default_sale_value: settings.default_sale_value,
      default_commission: settings.default_commission,
    },
  });

  async function onSubmit(data: z.output<typeof settingsSchema>) {
    const result = await updateSettings(
      data.default_sale_value,
      data.default_commission
    );
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Configurações salvas!");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md">
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
        <p className="text-sm text-indigo-700">
          Valores atuais: Venda padrão{" "}
          <strong>{formatCurrency(settings.default_sale_value)}</strong> ·
          Comissão <strong>{formatCurrency(settings.default_commission)}</strong>
        </p>
      </div>

      <Input
        label="Valor Padrão da Venda (R$)"
        type="number"
        step="0.01"
        error={errors.default_sale_value?.message}
        {...register("default_sale_value")}
      />
      <Input
        label="Comissão Padrão (R$)"
        type="number"
        step="0.01"
        error={errors.default_commission?.message}
        {...register("default_commission")}
      />

      <p className="text-xs text-slate-500">
        Ao marcar um lead como &quot;Fechado&quot;, estes valores serão aplicados
        automaticamente caso nenhum valor personalizado tenha sido informado.
      </p>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </form>
  );
}
