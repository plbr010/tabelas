export type UserRole = "admin" | "freelancer";

export type LeadStatus =
  | "novo"
  | "contato"
  | "proposta"
  | "fechado"
  | "perdido";

export interface Profile {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  company_name: string;
  contact_name: string;
  whatsapp: string;
  city: string;
  niche: string | null;
  notes: string | null;
  sale_value: number | null;
  commission_value: number | null;
  status: LeadStatus;
  freelancer_id: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  freelancer?: Profile;
}

export interface SystemSettings {
  id: string;
  default_sale_value: number;
  default_commission: number;
  updated_at: string;
}

export interface DashboardMetrics {
  totalLeads: number;
  novos: number;
  emNegociacao: number;
  fechados: number;
  perdidos: number;
  totalVendas: number;
  valorTotalVendido: number;
  comissaoTotal: number;
}

export interface FreelancerRanking {
  id: string;
  name: string;
  totalLeads: number;
  vendasFechadas: number;
  taxaConversao: number;
  comissaoAcumulada: number;
}

export interface FreelancerMetrics {
  totalLeads: number;
  vendasFechadas: number;
  valorTotalVendido: number;
  comissaoEstimada: number;
}

export interface LeadFilters {
  search?: string;
  city?: string;
  whatsapp?: string;
  freelancer_id?: string;
  status?: LeadStatus | "all";
}
