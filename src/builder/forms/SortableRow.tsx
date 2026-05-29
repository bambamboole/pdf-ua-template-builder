import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties, ReactNode } from "react";

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
    <div
      ref={setNodeRef}
      className="relative grid gap-2 rounded-md border border-solid border-border bg-surface-muted py-3 pr-8 pl-8"
      style={style}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="absolute top-2 left-2 inline-grid h-[22px] w-[22px] cursor-grab place-items-center rounded border-0 bg-transparent p-0 font-mono text-xs tracking-tighter text-fg-muted hover:bg-surface hover:text-fg active:cursor-grabbing"
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
        className="absolute top-2 right-2 inline-grid h-[22px] w-[22px] cursor-pointer place-items-center rounded border-0 bg-transparent p-0 text-xs text-fg-muted hover:bg-danger-soft hover:text-danger"
        aria-label={removeLabel}
        onClick={onRemove}
      >
        ✕
      </button>
    </div>
  );
}
