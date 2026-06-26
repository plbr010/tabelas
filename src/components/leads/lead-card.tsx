"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { Building2, MapPin, Phone, User, Calendar } from "lucide-react";
import type { Lead } from "@/types/database";
import { cn, formatDate, getInitials } from "@/lib/utils";

interface LeadCardProps {
  lead: Lead;
  isAdmin: boolean;
  isDragging?: boolean;
}

export function LeadCard({ lead, isAdmin, isDragging }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing",
        "hover:shadow-md hover:border-slate-300/80",
        (isDragging || isSortableDragging) && "opacity-50 shadow-lg rotate-2"
      )}
    >
      <Link
        href={`/leads/${lead.id}`}
        onClick={(e) => e.stopPropagation()}
        className="block space-y-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
              <Building2 className="h-4 w-4 text-indigo-600" />
            </div>
            <h4 className="font-semibold text-sm text-slate-900 truncate">
              {lead.company_name}
            </h4>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate">{lead.contact_name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Phone className="h-3 w-3 shrink-0" />
            <span>{lead.whatsapp}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{lead.city}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          {isAdmin && lead.freelancer && (
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                {getInitials(lead.freelancer.name)}
              </div>
              <span className="text-[11px] text-slate-500 truncate max-w-[80px]">
                {lead.freelancer.name.split(" ")[0]}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1 text-[11px] text-slate-400 ml-auto">
            <Calendar className="h-3 w-3" />
            {formatDate(lead.created_at)}
          </div>
        </div>
      </Link>
    </div>
  );
}
