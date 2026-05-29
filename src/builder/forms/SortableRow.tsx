import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties, ReactNode } from "react";

const rowClass =
  "relative grid gap-2 rounded-md border border-solid border-stone-200 bg-stone-100 py-3 pr-8 pl-8";

const handleClass =
  "absolute top-2 left-2 inline-grid h-[22px] w-[22px] cursor-grab place-items-center rounded border-0 bg-transparent p-0 font-mono text-xs tracking-tighter text-stone-500 hover:bg-white hover:text-stone-900 active:cursor-grabbing";

const removeClass =
  "absolute top-2 right-2 inline-grid h-[22px] w-[22px] cursor-pointer place-items-center rounded border-0 bg-transparent p-0 text-xs text-stone-500 hover:bg-red-50 hover:text-red-700";

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
    <div ref={setNodeRef} className={rowClass} style={style}>
      <button
        ref={setActivatorNodeRef}
        type="button"
        className={handleClass}
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
        className={removeClass}
        aria-label={removeLabel}
        onClick={onRemove}
      >
        ✕
      </button>
    </div>
  );
}
