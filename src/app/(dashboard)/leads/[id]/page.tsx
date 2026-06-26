import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  getCurrentProfile,
  getLeadById,
  getActiveFreelancers,
  deleteLead,
} from "@/lib/actions";
import { LeadForm } from "@/components/leads/lead-form";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ArrowLeft, Trash2 } from "lucide-react";

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const lead = await getLeadById(id);
  if (!lead) notFound();

  const isAdmin = profile.role === "admin";
  const freelancers = isAdmin ? await getActiveFreelancers() : [];

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/leads">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {lead.company_name}
            </h1>
            <StatusBadge status={lead.status} />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Cadastrado em {formatDateTime(lead.created_at)}
            {lead.freelancer && isAdmin && (
              <> · Freelancer: {lead.freelancer.name}</>
            )}
          </p>
        </div>
      </div>

      {lead.status === "fechado" && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Venda Fechada</p>
            <p className="text-xs text-emerald-600">
              Fechado em {formatDateTime(lead.closed_at)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-emerald-800">
              {formatCurrency(lead.sale_value)}
            </p>
            <p className="text-xs text-emerald-600">
              Comissão: {formatCurrency(lead.commission_value)}
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Editar Lead</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadForm
            lead={lead}
            isAdmin={isAdmin}
            freelancers={freelancers}
            currentUserId={profile.id}
          />
        </CardContent>
      </Card>

      {isAdmin && (
        <div className="mt-6 flex justify-end">
          <form
            action={async () => {
              "use server";
              await deleteLead(id);
              redirect("/leads");
            }}
          >
            <Button type="submit" variant="destructive" size="sm">
              <Trash2 className="h-4 w-4" />
              Excluir Lead
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
