import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties, ReactNode } from "react";
import { arrayHandleClass, arrayItemSortableClass, arrayRemoveClass } from "./controls/fieldStyles";

export interface SortableRowProps {
  id: string;
  dragLabel: string;
  removeLabel: string;
  removeName?: string;
  onRemove: () => void;
  children: ReactNode;
}

export function SortableRow({
  id,
  dragLabel,
  removeLabel,
  removeName,
  onRemove,
  children,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} className={arrayItemSortableClass} style={style}>
      <button
        ref={setActivatorNodeRef}
        type="button"
        className={arrayHandleClass}
        aria-label={dragLabel}
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      {children}
      <button
        type="button"
        data-name={removeName}
        className={arrayRemoveClass}
        aria-label={removeLabel}
        onClick={onRemove}
      >
        ✕
      </button>
    </div>
  );
}
