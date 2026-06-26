"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type {
  DashboardMetrics,
  FreelancerMetrics,
  FreelancerRanking,
  Lead,
  LeadFilters,
  Profile,
  SystemSettings,
  UserRole,
} from "@/types/database";
import type { LeadFormData } from "@/lib/validations";
import { resolveUserRole } from "@/lib/constants";
import type { LeadStatus } from "@/types/database";

function validateLeadStatusChange(
  role: UserRole,
  currentStatus: LeadStatus | undefined,
  newStatus: LeadStatus | undefined
): string | null {
  if (!newStatus || role === "admin") return null;

  if (!currentStatus || newStatus !== currentStatus) {
    return "Apenas administradores podem alterar o status do lead";
  }

  return null;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (data) return data;

  const adminClient = createAdminClient();
  const name =
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Usuário";
  const role = user.email ? resolveUserRole(user.email) : "freelancer";

  const { data: created, error } = await adminClient
    .from("profiles")
    .upsert(
      {
        id: user.id,
        name,
        email: user.email!,
        role,
        active: true,
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error || !created) return null;
  return created;
}

export async function getLeads(filters?: LeadFilters): Promise<Lead[]> {
  const supabase = await createClient();
  let query = supabase
    .from("leads")
    .select("*, freelancer:profiles!freelancer_id(*)")
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.city) {
    query = query.ilike("city", `%${filters.city}%`);
  }
  if (filters?.whatsapp) {
    query = query.ilike("whatsapp", `%${filters.whatsapp}%`);
  }
  if (filters?.freelancer_id) {
    query = query.eq("freelancer_id", filters.freelancer_id);
  }
  if (filters?.search) {
    query = query.or(
      `company_name.ilike.%${filters.search}%,contact_name.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Lead[]) ?? [];
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*, freelancer:profiles!freelancer_id(*)")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Lead;
}

export async function createLead(data: LeadFormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Usuário não autenticado" };

  const freelancerId =
    profile.role === "admin" && data.freelancer_id
      ? data.freelancer_id
      : profile.id;

  const statusError = validateLeadStatusChange(
    profile.role,
    undefined,
    profile.role === "admin" ? data.status : "novo"
  );
  if (statusError) return { error: statusError };

  const { error } = await supabase.from("leads").insert({
    company_name: data.company_name,
    contact_name: data.contact_name,
    whatsapp: data.whatsapp,
    city: data.city,
    niche: data.niche || null,
    notes: data.notes || null,
    status: profile.role === "admin" ? data.status : "novo",
    freelancer_id: freelancerId,
  });

  if (error) return { error: error.message };

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");
  return {};
}

export async function updateLead(
  id: string,
  data: Partial<LeadFormData>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Usuário não autenticado" };

  const existing = await getLeadById(id);
  if (!existing) return { error: "Lead não encontrado" };

  if (data.status) {
    const statusError = validateLeadStatusChange(
      profile.role,
      existing.status,
      data.status
    );
    if (statusError) return { error: statusError };
  }

  const updateData: Record<string, unknown> = {};
  if (data.company_name) updateData.company_name = data.company_name;
  if (data.contact_name) updateData.contact_name = data.contact_name;
  if (data.city) updateData.city = data.city;
  if (data.niche !== undefined) updateData.niche = data.niche || null;
  if (data.notes !== undefined) updateData.notes = data.notes || null;

  if (profile.role === "admin") {
    if (data.status) updateData.status = data.status;
    if (data.whatsapp) updateData.whatsapp = data.whatsapp;
    if (data.freelancer_id) updateData.freelancer_id = data.freelancer_id;
  }

  const { error } = await supabase.from("leads").update(updateData).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  revalidatePath(`/leads/${id}`);
  revalidatePath("/relatorios");
  return {};
}

export async function updateLeadStatus(
  id: string,
  status: Lead["status"]
): Promise<{ error?: string }> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return { error: "Apenas administradores podem alterar o status" };
  }

  return updateLead(id, { status });
}

export async function deleteLead(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return { error: "Apenas administradores podem excluir leads" };
  }

  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");
  return {};
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient();
  const { data: leads } = await supabase.from("leads").select("*");

  const all = leads ?? [];
  const fechados = all.filter((l) => l.status === "fechado");

  return {
    totalLeads: all.length,
    novos: all.filter((l) => l.status === "novo").length,
    emNegociacao: all.filter((l) =>
      ["contato", "proposta"].includes(l.status)
    ).length,
    fechados: fechados.length,
    perdidos: all.filter((l) => l.status === "perdido").length,
    totalVendas: fechados.length,
    valorTotalVendido: fechados.reduce(
      (sum, l) => sum + (Number(l.sale_value) || 0),
      0
    ),
    comissaoTotal: fechados.reduce(
      (sum, l) => sum + (Number(l.commission_value) || 0),
      0
    ),
  };
}

export async function getFreelancerMetrics(
  freelancerId?: string
): Promise<FreelancerMetrics> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const id = freelancerId ?? profile?.id;
  if (!id) {
    return {
      totalLeads: 0,
      vendasFechadas: 0,
      valorTotalVendido: 0,
      comissaoEstimada: 0,
    };
  }

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("freelancer_id", id);

  const all = leads ?? [];
  const fechados = all.filter((l) => l.status === "fechado");

  return {
    totalLeads: all.length,
    vendasFechadas: fechados.length,
    valorTotalVendido: fechados.reduce(
      (sum, l) => sum + (Number(l.sale_value) || 0),
      0
    ),
    comissaoEstimada: fechados.reduce(
      (sum, l) => sum + (Number(l.commission_value) || 0),
      0
    ),
  };
}

export async function getFreelancerRanking(): Promise<FreelancerRanking[]> {
  const supabase = await createClient();
  const { data: freelancers } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "freelancer")
    .eq("active", true);

  const { data: leads } = await supabase.from("leads").select("*");
  const allLeads = leads ?? [];

  return (freelancers ?? [])
    .map((f) => {
      const freelancerLeads = allLeads.filter((l) => l.freelancer_id === f.id);
      const fechados = freelancerLeads.filter((l) => l.status === "fechado");
      const totalLeads = freelancerLeads.length;
      const vendasFechadas = fechados.length;

      return {
        id: f.id,
        name: f.name,
        totalLeads,
        vendasFechadas,
        taxaConversao:
          totalLeads > 0 ? (vendasFechadas / totalLeads) * 100 : 0,
        comissaoAcumulada: fechados.reduce(
          (sum, l) => sum + (Number(l.commission_value) || 0),
          0
        ),
      };
    })
    .sort((a, b) => b.vendasFechadas - a.vendasFechadas);
}

export async function getFreelancers(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "freelancer")
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getActiveFreelancers(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "freelancer")
    .eq("active", true)
    .order("name");

  return data ?? [];
}

export async function getSettings(): Promise<SystemSettings | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("system_settings").select("*").limit(1).single();
  return data;
}

export async function updateSettings(
  default_sale_value: number,
  default_commission: number
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const settings = await getSettings();
  if (!settings) return { error: "Configurações não encontradas" };

  const { error } = await supabase
    .from("system_settings")
    .update({ default_sale_value, default_commission })
    .eq("id", settings.id);

  if (error) return { error: error.message };
  revalidatePath("/configuracoes");
  return {};
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function requireRole(roles: UserRole[]) {
  const profile = await getCurrentProfile();
  if (!profile || !roles.includes(profile.role)) {
    throw new Error("Acesso negado");
  }
  return profile;
}

export async function getLeadsByStatusForChart(): Promise<
  { status: string; count: number; label: string }[]
> {
  const metrics = await getDashboardMetrics();
  return [
    { status: "novo", count: metrics.novos, label: "Novos" },
    {
      status: "negociacao",
      count: metrics.emNegociacao,
      label: "Em Negociação",
    },
    { status: "fechado", count: metrics.fechados, label: "Fechados" },
    { status: "perdido", count: metrics.perdidos, label: "Perdidos" },
  ];
}

export async function getMonthlySalesChart(): Promise<
  { month: string; vendas: number; valor: number }[]
> {
  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("status", "fechado");

  const months: Record<string, { vendas: number; valor: number }> = {};
  const monthNames = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    months[key] = { vendas: 0, valor: 0 };
  }

  (leads ?? []).forEach((lead) => {
    if (!lead.closed_at) return;
    const d = new Date(lead.closed_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (months[key]) {
      months[key].vendas += 1;
      months[key].valor += Number(lead.sale_value) || 0;
    }
  });

  return Object.entries(months).map(([key, val]) => {
    const [, monthIdx] = key.split("-");
    return {
      month: monthNames[parseInt(monthIdx)],
      vendas: val.vendas,
      valor: val.valor,
    };
  });
}
