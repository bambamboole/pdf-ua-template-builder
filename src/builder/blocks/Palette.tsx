import { useTemplateBuilder } from "../context/BuilderContext";
import { BlockPalette } from "./BlockPalette";

export interface PaletteProps {
  className?: string;
}

export function Palette({ className }: PaletteProps = {}) {
  const { blockTypes, addBlock } = useTemplateBuilder();

  return (
    <aside
      className={`flex min-w-0 items-center overflow-hidden border-0 border-b border-solid border-border bg-surface px-4 py-2${className ? ` ${className}` : ""}`}
      aria-label="Block palette"
    >
      <div className="flex w-full min-w-0 items-center gap-3">
        <h2 className="m-0 flex-none text-2xs font-medium uppercase tracking-[0.06em] text-fg-subtle">
          Blocks
        </h2>
        <BlockPalette blockTypes={blockTypes} onAdd={addBlock} />
      </div>
    </aside>
  );
}
