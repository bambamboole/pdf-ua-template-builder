import { useDraggable } from "@dnd-kit/core";
import { getBlockChrome } from "./blockChrome";

export interface BlockPaletteProps {
  blockTypes: string[];
  onAdd?: (type: string) => void;
}

export function BlockPalette({ blockTypes, onAdd }: BlockPaletteProps) {
  return (
    <div className="builder-palette__list" aria-label="Block palette">
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
      className="builder-palette__item"
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0 : undefined,
      }}
      onClick={() => onAdd?.(type)}
      aria-label={`Add ${chrome.label}`}
      {...listeners}
      {...attributes}
    >
      <span className="builder-chip" aria-hidden="true">
        {chrome.chip}
      </span>
      <span>{chrome.label}</span>
    </button>
  );
}
