"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/types/database";

interface KanbanColumnProps {
  status: LeadStatus;
  title: string;
  count: number;
  colors: { bg: string; text: string; border: string; dot: string };
  droppableDisabled?: boolean;
  readOnly?: boolean;
  children: React.ReactNode;
}

export function KanbanColumn({
  status,
  title,
  count,
  colors,
  droppableDisabled = false,
  readOnly = false,
  children,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    disabled: droppableDisabled || readOnly,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-72 snap-start rounded-xl border transition-colors duration-200",
        colors.border,
        droppableDisabled && "opacity-75",
        isOver && !droppableDisabled && !readOnly
          ? "bg-indigo-50/50 border-indigo-300"
          : "bg-slate-50/50"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-200/60">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", colors.dot)} />
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        </div>
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
            colors.bg,
            colors.text
          )}
        >
          {count}
        </span>
      </div>
      <div className="p-3 max-h-[calc(100vh-280px)] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
