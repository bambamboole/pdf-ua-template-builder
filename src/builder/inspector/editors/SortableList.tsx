import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { ReactNode } from "react";
import { useBuilderSensors } from "../../lib/sensors";

export interface SortableListProps {
  count: number;
  onReorder: (sourceIndex: number, targetIndex: number) => void;
  children: ReactNode;
}

export function SortableList({ count, onReorder, children }: SortableListProps) {
  const sensors = useBuilderSensors();

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const sourceIndex = Number(active.id);
    const targetIndex = Number(over.id);

    if (!Number.isFinite(sourceIndex) || !Number.isFinite(targetIndex)) {
      return;
    }

    onReorder(sourceIndex, targetIndex);
  }

  const sortableIds = Array.from({ length: count }, (_, index) => String(index));

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}
