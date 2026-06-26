import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/types/database";
import { LEAD_STATUS_COLORS } from "@/lib/utils";

interface BadgeProps {
  status: LeadStatus;
  className?: string;
}

export function StatusBadge({ status, className }: BadgeProps) {
  const colors = LEAD_STATUS_COLORS[status];
  const labels: Record<LeadStatus, string> = {
    novo: "Novo",
    contato: "Em Contato",
    proposta: "Proposta",
    fechado: "Fechado",
    perdido: "Perdido",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border",
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
      {labels[status]}
    </span>
  );
}

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}) {
  const variants = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
