import {
  getCurrentProfile,
  getDashboardMetrics,
  getFreelancerMetrics,
  getLeadsByStatusForChart,
  getMonthlySalesChart,
} from "@/lib/actions";
import { MetricCard } from "@/components/dashboard/metric-card";
import { StatusChart, SalesChart } from "@/components/dashboard/charts";
import {
  Users,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  XCircle,
  DollarSign,
  TrendingUp,
  Award,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === "admin";

  if (isAdmin) {
    const [metrics, statusData, salesData] = await Promise.all([
      getDashboardMetrics(),
      getLeadsByStatusForChart(),
      getMonthlySalesChart(),
    ]);

    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Visão geral de todos os leads e vendas
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total de Leads"
            value={metrics.totalLeads}
            icon={Users}
            iconClassName="bg-indigo-50 text-indigo-600"
          />
          <MetricCard
            title="Novos"
            value={metrics.novos}
            icon={Sparkles}
            iconClassName="bg-blue-50 text-blue-600"
          />
          <MetricCard
            title="Em Negociação"
            value={metrics.emNegociacao}
            icon={MessageSquare}
            iconClassName="bg-amber-50 text-amber-600"
          />
          <MetricCard
            title="Fechados"
            value={metrics.fechados}
            icon={CheckCircle2}
            iconClassName="bg-emerald-50 text-emerald-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title="Perdidos"
            value={metrics.perdidos}
            icon={XCircle}
            iconClassName="bg-red-50 text-red-600"
          />
          <MetricCard
            title="Valor Total Vendido"
            value={metrics.valorTotalVendido}
            icon={DollarSign}
            iconClassName="bg-emerald-50 text-emerald-600"
          />
          <MetricCard
            title="Comissões Totais"
            value={metrics.comissaoTotal}
            icon={TrendingUp}
            iconClassName="bg-purple-50 text-purple-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatusChart data={statusData} />
          <SalesChart data={salesData} />
        </div>
      </div>
    );
  }

  const metrics = await getFreelancerMetrics();

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Olá, {profile?.name.split(" ")[0]}!
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Acompanhe seu desempenho e comissões
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Leads Cadastrados"
          value={metrics.totalLeads}
          icon={Users}
          iconClassName="bg-indigo-50 text-indigo-600"
        />
        <MetricCard
          title="Vendas Fechadas"
          value={metrics.vendasFechadas}
          icon={CheckCircle2}
          iconClassName="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          title="Valor Total Vendido"
          value={metrics.valorTotalVendido}
          icon={DollarSign}
          iconClassName="bg-blue-50 text-blue-600"
        />
        <MetricCard
          title="Comissão Estimada"
          value={metrics.comissaoEstimada}
          subtitle="Baseado em vendas fechadas"
          icon={Award}
          iconClassName="bg-purple-50 text-purple-600"
        />
      </div>

      <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-indigo-600 font-medium">Sua comissão acumulada</p>
            <p className="text-3xl font-bold text-indigo-900">
              {formatCurrency(metrics.comissaoEstimada)}
            </p>
          </div>
        </div>
        <p className="text-xs text-indigo-500 mt-3">
          Comissão padrão de R$ 250,00 por venda fechada. Valores atualizados automaticamente.
        </p>
      </div>
    </div>
  );
}
