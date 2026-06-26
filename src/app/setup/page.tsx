import { SetupAdminForm } from "@/components/auth/setup-admin-form";

export default function SetupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-indigo-100/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-100/40 blur-3xl" />
      </div>
      <div className="relative animate-fade-in">
        <SetupAdminForm />
      </div>
    </div>
  );
}
