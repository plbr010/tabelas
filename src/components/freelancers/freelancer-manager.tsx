"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  freelancerSchema,
  freelancerUpdateSchema,
  type FreelancerFormData,
  type FreelancerUpdateFormData,
} from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/types/database";
import { Pencil, UserPlus } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface FreelancerFormProps {
  freelancer?: Profile;
  onClose: () => void;
}

export function FreelancerForm({ freelancer, onClose }: FreelancerFormProps) {
  const router = useRouter();
  const isEditing = !!freelancer;
  const [loading, setLoading] = useState(false);

  const createForm = useForm<FreelancerFormData>({
    resolver: zodResolver(freelancerSchema),
    defaultValues: { name: "", phone: "", email: "", password: "" },
  });

  const editForm = useForm<FreelancerUpdateFormData>({
    resolver: zodResolver(freelancerUpdateSchema),
    defaultValues: {
      name: freelancer?.name ?? "",
      phone: freelancer?.phone ?? "",
      email: freelancer?.email ?? "",
      password: "",
      active: freelancer?.active ?? true,
    },
  });

  async function onCreate(data: FreelancerFormData) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/freelancers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Erro ao criar freelancer");
        return;
      }
      toast.success("Freelancer criado com sucesso!");
      router.refresh();
      onClose();
    } catch {
      toast.error("Erro ao criar freelancer");
    } finally {
      setLoading(false);
    }
  }

  async function onEdit(data: FreelancerUpdateFormData) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/freelancers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: freelancer!.id, ...data }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Erro ao atualizar freelancer");
        return;
      }
      toast.success("Freelancer atualizado!");
      router.refresh();
      onClose();
    } catch {
      toast.error("Erro ao atualizar freelancer");
    } finally {
      setLoading(false);
    }
  }

  if (isEditing) {
    const { register, handleSubmit, formState: { errors } } = editForm;
    return (
      <form onSubmit={handleSubmit(onEdit)} className="space-y-4">
        <Input label="Nome *" error={errors.name?.message} {...register("name")} />
        <Input label="Telefone" placeholder="(11) 99999-9999" {...register("phone")} />
        <Input label="E-mail *" type="email" error={errors.email?.message} {...register("email")} />
        <Input
          label="Nova Senha (deixe vazio para manter)"
          type="password"
          error={errors.password?.message}
          {...register("password")}
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" {...register("active")} className="rounded border-slate-300" />
          <span className="text-sm text-slate-700">Freelancer ativo</span>
        </label>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  const { register, handleSubmit, formState: { errors } } = createForm;
  return (
    <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
      <Input label="Nome *" error={errors.name?.message} {...register("name")} />
      <Input label="Telefone" placeholder="(11) 99999-9999" {...register("phone")} />
      <Input label="E-mail *" type="email" error={errors.email?.message} {...register("email")} />
      <Input
        label="Senha *"
        type="password"
        error={errors.password?.message}
        {...register("password")}
      />
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Criando..." : "Criar Freelancer"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

interface FreelancerTableProps {
  freelancers: Profile[];
}

export function FreelancerTable({ freelancers }: FreelancerTableProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingFreelancer, setEditingFreelancer] = useState<Profile | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Freelancers</h2>
          <p className="text-sm text-slate-500">
            {freelancers.length} freelancer{freelancers.length !== 1 ? "s" : ""} cadastrado{freelancers.length !== 1 ? "s" : ""}
          </p>
        </div>
        {!showForm && !editingFreelancer && (
          <Button onClick={() => setShowForm(true)}>
            <UserPlus className="h-4 w-4" />
            Novo Freelancer
          </Button>
        )}
      </div>

      {(showForm || editingFreelancer) && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-4">
            {editingFreelancer ? "Editar Freelancer" : "Novo Freelancer"}
          </h3>
          <FreelancerForm
            freelancer={editingFreelancer ?? undefined}
            onClose={() => {
              setShowForm(false);
              setEditingFreelancer(null);
            }}
          />
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  E-mail
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Telefone
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Cadastro
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {freelancers.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {f.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{f.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {f.phone || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={f.active ? "success" : "danger"}>
                      {f.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {formatDate(f.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingFreelancer(f)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {freelancers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                    Nenhum freelancer cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
