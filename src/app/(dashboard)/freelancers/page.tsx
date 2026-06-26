import { redirect } from "next/navigation";
import { getCurrentProfile, getFreelancers } from "@/lib/actions";
import { FreelancerTable } from "@/components/freelancers/freelancer-manager";

export default async function FreelancersPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const freelancers = await getFreelancers();

  return (
    <div className="animate-fade-in">
      <FreelancerTable freelancers={freelancers} />
    </div>
  );
}
