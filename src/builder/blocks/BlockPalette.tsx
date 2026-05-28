import { useDraggable } from "@dnd-kit/core";
import { getBlockChrome } from "./blockChrome";

export interface BlockPaletteProps {
  blockTypes: string[];
  onAdd?: (type: string) => void;
}

const paletteListClass = "flex min-w-0 gap-1 overflow-x-auto [scrollbar-width:thin]";

const paletteItemClass =
  "flex flex-none cursor-grab items-center gap-3 m-0 min-h-8 rounded-md border border-solid border-transparent bg-transparent px-2 py-1 text-left text-xs font-medium text-stone-900 transition-colors hover:border-stone-200 hover:bg-stone-100 active:scale-[0.98] active:cursor-grabbing active:bg-stone-100";

const chipClass =
  "inline-grid h-[22px] w-[22px] flex-none place-items-center rounded bg-stone-100 font-mono text-[11px] font-semibold text-stone-500";

export function BlockPalette({ blockTypes, onAdd }: BlockPaletteProps) {
  return (
    <div className={paletteListClass} aria-label="Block palette">
      {blockTypes.map((type) => (
        <PaletteItem key={type} type={type} onAdd={onAdd} />
      ))}
    </div>
  );
}

interface PaletteItemProps {
  type: string;
  onAdd?: (type: string) => void;
}

function PaletteItem({ type, onAdd }: PaletteItemProps) {
  const chrome = getBlockChrome(type);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: {
      source: "palette",
      type,
    },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={paletteItemClass}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0 : undefined,
      }}
      onClick={() => onAdd?.(type)}
      aria-label={`Add ${chrome.label}`}
      {...listeners}
      {...attributes}
    >
      <span className={chipClass} aria-hidden="true">
        {chrome.chip}
      </span>
      <span>{chrome.label}</span>
    </button>
  );
}
