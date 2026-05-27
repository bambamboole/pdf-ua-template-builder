import { useDraggable } from "@dnd-kit/core";

export interface BlockPaletteProps {
  blockTypes: string[];
}

export function BlockPalette({ blockTypes }: BlockPaletteProps) {
  return (
    <div className="block-palette" aria-label="Block palette">
      {blockTypes.map((type) => (
        <PaletteBlockButton key={type} type={type} />
      ))}
    </div>
  );
}

function PaletteBlockButton({ type }: { type: string }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
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
      className="block-palette__button"
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }}
      {...listeners}
      {...attributes}
    >
      {formatBlockLabel(type)}
    </button>
  );
}

function formatBlockLabel(type: string): string {
  return `+ ${type
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ")}`;
}
