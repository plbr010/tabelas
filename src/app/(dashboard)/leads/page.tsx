import { Suspense } from "react";
import {
  getCurrentProfile,
  getLeads,
  getActiveFreelancers,
} from "@/lib/actions";
import { KanbanBoard } from "@/components/leads/kanban-board";
import { LeadFiltersBar } from "@/components/leads/lead-filters";
import type { LeadFilters, LeadStatus } from "@/types/database";

interface LeadsPageProps {
  searchParams: Promise<{
    search?: string;
    city?: string;
    whatsapp?: string;
    status?: string;
    freelancer_id?: string;
  }>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === "admin";

  const filters: LeadFilters = {
    search: params.search,
    city: params.city,
    whatsapp: params.whatsapp,
    status: (params.status as LeadStatus) || "all",
    freelancer_id: params.freelancer_id,
  };

  const [leads, freelancers] = await Promise.all([
    getLeads(filters),
    isAdmin ? getActiveFreelancers() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isAdmin ? "Kanban de Leads" : "Meus Leads"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isAdmin
            ? "Arraste os cards entre as colunas para atualizar o status"
            : "Acompanhe em qual etapa cada lead está — apenas o administrador move as etapas"}
        </p>
      </div>

      <Suspense fallback={<div className="h-20 bg-slate-100 rounded-xl animate-pulse" />}>
        <LeadFiltersBar freelancers={freelancers} isAdmin={isAdmin} />
      </Suspense>

      <KanbanBoard leads={leads} isAdmin={isAdmin} />
    </div>
  );
}
