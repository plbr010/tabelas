import { getCurrentProfile, getFreelancerRanking } from "@/lib/actions";
import { RankingChart } from "@/components/dashboard/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Trophy, Medal, Award } from "lucide-react";
import { redirect } from "next/navigation";

const rankIcons = [Trophy, Medal, Award];
const rankColors = [
  "text-amber-500",
  "text-slate-400",
  "text-amber-700",
];

export default async function RelatoriosPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const isAdmin = profile.role === "admin";
  const ranking = await getFreelancerRanking();

  const filteredRanking = isAdmin
    ? ranking
    : ranking.filter((r) => r.id === profile.id);

  const chartData = filteredRanking.map((r) => ({
    name: r.name.split(" ")[0],
    vendas: r.vendasFechadas,
    comissao: r.comissaoAcumulada,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isAdmin ? "Relatórios" : "Meu Desempenho"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isAdmin
            ? "Ranking de performance dos freelancers"
            : "Acompanhe suas métricas de conversão"}
        </p>
      </div>

      {isAdmin && chartData.length > 0 && (
        <RankingChart data={chartData} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isAdmin ? "Ranking de Freelancers" : "Suas Métricas"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  {isAdmin && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                      #
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Freelancer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Leads
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Vendas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Conversão
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Comissão
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRanking.map((item, index) => {
                  const RankIcon = rankIcons[index];
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      {isAdmin && (
                        <td className="px-4 py-4">
                          {index < 3 && RankIcon ? (
                            <RankIcon
                              className={`h-5 w-5 ${rankColors[index]}`}
                            />
                          ) : (
                            <span className="text-sm text-slate-400 font-medium pl-1">
                              {index + 1}
                            </span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-4 text-sm font-medium text-slate-900">
                        {item.name}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {item.totalLeads}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-emerald-600">
                        {item.vendasFechadas}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full max-w-[80px]">
                            <div
                              className="h-2 bg-indigo-500 rounded-full transition-all"
                              style={{
                                width: `${Math.min(item.taxaConversao, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-slate-600">
                            {formatPercent(item.taxaConversao)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-purple-600">
                        {formatCurrency(item.comissaoAcumulada)}
                      </td>
                    </tr>
                  );
                })}
                {filteredRanking.length === 0 && (
                  <tr>
                    <td
                      colSpan={isAdmin ? 6 : 5}
                      className="px-4 py-12 text-center text-sm text-slate-500"
                    >
                      Nenhum dado disponível ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
