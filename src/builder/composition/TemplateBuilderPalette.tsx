import { useTemplateBuilderContext } from "../context/TemplateBuilderContext";
import { BlockPalette } from "../blocks/BlockPalette";

export interface TemplateBuilderPaletteProps {
  className?: string;
}

const paletteClass =
  "flex min-w-0 items-center overflow-hidden border-0 border-b border-solid border-border bg-surface px-4 py-2";

export function TemplateBuilderPalette({ className }: TemplateBuilderPaletteProps = {}) {
  const { blockTypes, addBlock } = useTemplateBuilderContext();

  return (
    <aside
      className={className ? `${paletteClass} ${className}` : paletteClass}
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
