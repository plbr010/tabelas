"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { leadSchema } from "@/lib/validations";
import type { z } from "zod";
import { createLead, updateLead } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { LEAD_STATUS_LABELS } from "@/lib/utils";
import type { Lead, Profile } from "@/types/database";

interface LeadFormProps {
  lead?: Lead;
  freelancers?: Profile[];
  isAdmin: boolean;
  currentUserId: string;
}

export function LeadForm({
  lead,
  freelancers,
  isAdmin,
  currentUserId,
}: LeadFormProps) {
  const router = useRouter();
  const isEditing = !!lead;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<
    z.input<typeof leadSchema>,
    unknown,
    z.output<typeof leadSchema>
  >({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      company_name: lead?.company_name ?? "",
      contact_name: lead?.contact_name ?? "",
      whatsapp: lead?.whatsapp ?? "",
      city: lead?.city ?? "",
      niche: lead?.niche ?? "",
      notes: lead?.notes ?? "",
      status: lead?.status ?? "novo",
      freelancer_id: lead?.freelancer_id ?? currentUserId,
    },
  });

  async function onSubmit(data: z.output<typeof leadSchema>) {
    const result = isEditing
      ? await updateLead(lead.id, data)
      : await createLead(data);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Lead atualizado!" : "Lead cadastrado com sucesso!");
    router.push("/leads");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nome da Empresa *"
          id="company_name"
          error={errors.company_name?.message}
          {...register("company_name")}
        />
        <Input
          label="Nome do Contato *"
          id="contact_name"
          error={errors.contact_name?.message}
          {...register("contact_name")}
        />
        <Input
          label="WhatsApp *"
          id="whatsapp"
          placeholder="(11) 99999-9999"
          error={errors.whatsapp?.message}
          disabled={isEditing && !isAdmin}
          {...register("whatsapp")}
        />
        {isEditing && !isAdmin && (
          <p className="text-xs text-amber-600 col-span-full -mt-2">
            O WhatsApp não pode ser alterado. Entre em contato com o administrador.
          </p>
        )}
        <Input
          label="Cidade *"
          id="city"
          error={errors.city?.message}
          {...register("city")}
        />
        <Input
          label="Nicho"
          id="niche"
          placeholder="Ex: Tecnologia, Saúde, Alimentação"
          {...register("niche")}
        />
        {isAdmin ? (
          <Select
            label="Status"
            id="status"
            options={Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
            error={errors.status?.message}
            {...register("status")}
          />
        ) : isEditing ? (
          <div className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">
              Etapa atual
            </span>
            <StatusBadge status={lead!.status} />
            <p className="text-xs text-slate-500">
              O administrador atualiza a etapa. Você pode acompanhar aqui e no
              kanban.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">
              Etapa inicial
            </span>
            <StatusBadge status="novo" />
            <p className="text-xs text-slate-500">
              Novos leads começam como &quot;Novo Interessado&quot;.
            </p>
          </div>
        )}
        {isAdmin && freelancers && (
          <Select
            label="Freelancer Responsável"
            id="freelancer_id"
            options={freelancers.map((f) => ({
              value: f.id,
              label: f.name,
            }))}
            disabled={isEditing && !isAdmin}
            {...register("freelancer_id")}
          />
        )}
      </div>

      <Textarea
        label="Observações"
        id="notes"
        placeholder="Informações adicionais sobre o lead..."
        rows={4}
        {...register("notes")}
      />

      <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Salvando..."
            : isEditing
              ? "Salvar Alterações"
              : "Cadastrar Lead"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
