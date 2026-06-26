"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LEAD_STATUS_LABELS } from "@/lib/utils";
import type { Profile } from "@/types/database";

interface LeadFiltersProps {
  freelancers?: Profile[];
  isAdmin: boolean;
}

export function LeadFiltersBar({ freelancers, isAdmin }: LeadFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const city = searchParams.get("city") ?? "";
  const whatsapp = searchParams.get("whatsapp") ?? "";
  const status = searchParams.get("status") ?? "all";
  const freelancer_id = searchParams.get("freelancer_id") ?? "";

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/leads?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/leads");
  }

  const hasFilters = search || city || whatsapp || status !== "all" || freelancer_id;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <Filter className="h-4 w-4" />
        Filtros
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
            <X className="h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            placeholder="Buscar empresa..."
            defaultValue={search}
            onChange={(e) => {
              const val = e.target.value;
              const timeout = setTimeout(() => updateFilter("search", val), 300);
              return () => clearTimeout(timeout);
            }}
            className="flex h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <input
          placeholder="Cidade"
          defaultValue={city}
          onChange={(e) => updateFilter("city", e.target.value)}
          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          placeholder="WhatsApp"
          defaultValue={whatsapp}
          onChange={(e) => updateFilter("whatsapp", e.target.value)}
          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <Select
          options={[
            { value: "all", label: "Todos os status" },
            ...Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
          value={status}
          onChange={(e) => updateFilter("status", e.target.value === "all" ? "" : e.target.value)}
        />
        {isAdmin && freelancers && (
          <Select
            options={[
              { value: "", label: "Todos freelancers" },
              ...freelancers.map((f) => ({ value: f.id, label: f.name })),
            ]}
            value={freelancer_id}
            onChange={(e) => updateFilter("freelancer_id", e.target.value)}
          />
        )}
      </div>
    </div>
  );
}
