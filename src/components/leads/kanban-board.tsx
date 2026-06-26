"use client";

import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Lead, LeadStatus } from "@/types/database";
import {
  KANBAN_COLUMNS,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
} from "@/lib/utils";
import { KanbanColumn } from "./kanban-column";
import { LeadCard } from "./lead-card";
import { updateLeadStatus } from "@/lib/actions";

interface KanbanBoardProps {
  leads: Lead[];
  isAdmin: boolean;
}

function KanbanReadOnly({ leads, isAdmin }: KanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
      {KANBAN_COLUMNS.map((status) => {
        const columnLeads = leads.filter((l) => l.status === status);
        const colors = LEAD_STATUS_COLORS[status];

        return (
          <KanbanColumn
            key={status}
            status={status}
            title={LEAD_STATUS_LABELS[status]}
            count={columnLeads.length}
            colors={colors}
            readOnly
          >
            <div className="space-y-3 min-h-[100px]">
              {columnLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  isAdmin={isAdmin}
                  draggable={false}
                />
              ))}
            </div>
          </KanbanColumn>
        );
      })}
    </div>
  );
}

export function KanbanBoard({ leads, isAdmin }: KanbanBoardProps) {
  const [items, setItems] = useState(leads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  if (!isAdmin) {
    return <KanbanReadOnly leads={leads} isAdmin={isAdmin} />;
  }

  const activeLead = activeId
    ? items.find((l) => l.id === activeId)
    : null;

  function getLeadsByStatus(status: LeadStatus) {
    return items.filter((l) => l.status === status);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;

    if (!KANBAN_COLUMNS.includes(newStatus)) return;

    const lead = items.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    setItems((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    startTransition(async () => {
      const result = await updateLeadStatus(leadId, newStatus);
      if (result.error) {
        setItems(leads);
        toast.error(result.error);
      } else {
        toast.success(`Lead movido para "${LEAD_STATUS_LABELS[newStatus]}"`);
      }
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
        {KANBAN_COLUMNS.map((status) => {
          const columnLeads = getLeadsByStatus(status);
          const colors = LEAD_STATUS_COLORS[status];
          return (
            <KanbanColumn
              key={status}
              status={status}
              title={LEAD_STATUS_LABELS[status]}
              count={columnLeads.length}
              colors={colors}
            >
              <SortableContext
                items={columnLeads.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3 min-h-[100px]">
                  {columnLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      isAdmin={isAdmin}
                      draggable
                    />
                  ))}
                </div>
              </SortableContext>
            </KanbanColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeLead && (
          <LeadCard lead={activeLead} isAdmin={isAdmin} draggable isDragging />
        )}
      </DragOverlay>
    </DndContext>
  );
}
