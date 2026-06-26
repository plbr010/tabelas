import { redirect } from "next/navigation";
import {
  getCurrentProfile,
  getActiveFreelancers,
} from "@/lib/actions";
import { LeadForm } from "@/components/leads/lead-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NovoLeadPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const freelancers =
    profile.role === "admin" ? await getActiveFreelancers() : [];

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Cadastrar Lead</h1>
        <p className="text-sm text-slate-500 mt-1">
          Preencha os dados do possível cliente interessado
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do Lead</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadForm
            isAdmin={profile.role === "admin"}
            freelancers={freelancers}
            currentUserId={profile.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
