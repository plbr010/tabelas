import { redirect } from "next/navigation";
import { getCurrentProfile, getSettings } from "@/lib/actions";
import { SettingsForm } from "@/components/settings/settings-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function ConfiguracoesPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const settings = await getSettings();
  if (!settings) {
    return <p>Configurações não encontradas.</p>;
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure valores padrão de venda e comissão
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sistema de Comissão</CardTitle>
          <CardDescription>
            Valores aplicados automaticamente ao fechar uma venda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm settings={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
