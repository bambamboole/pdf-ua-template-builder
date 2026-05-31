import {
  useBuilderActions,
  useBuilderState,
  type TemplateExample,
} from "../context/BuilderContext";
import { Select } from "../controls";
import { Button } from "../primitives/Button";
import { BlockPalette } from "./BlockPalette";

export interface PaletteProps {
  className?: string;
  /** Loadable examples keyed by display name. The Load control only renders when non-empty. */
  examples?: Record<string, TemplateExample>;
}

export function Palette({ className, examples }: PaletteProps = {}) {
  const { blockTypes, schema } = useBuilderState();
  const { addBlock, loadExample } = useBuilderActions();
  const exampleEntries = examples ? Object.entries(examples) : [];

  return (
    <aside
      className={`flex h-[56px] min-w-0 items-center overflow-hidden border-0 border-b border-solid border-border bg-surface px-4${className ? ` ${className}` : ""}`}
      aria-label="Block palette"
    >
      <div className="flex w-full min-w-0 items-center gap-3">
        <h2 className="m-0 flex-none text-2xs font-medium uppercase tracking-[0.06em] text-fg-subtle">
          Blocks
        </h2>
        <BlockPalette blockTypes={blockTypes} onAdd={addBlock} />
        {exampleEntries.length > 0 ? (
          <div className="ml-auto flex-none">
            <ExampleLoader entries={exampleEntries} disabled={!schema} onLoad={loadExample} />
          </div>
        ) : null}
      </div>
    </aside>
  );
}

interface ExampleLoaderProps {
  entries: [string, TemplateExample][];
  disabled: boolean;
  onLoad: (example: TemplateExample) => void;
}

function ExampleLoader({ entries, disabled, onLoad }: ExampleLoaderProps) {
  if (entries.length === 1) {
    const [, example] = entries[0];

    return (
      <Button onClick={() => onLoad(example)} disabled={disabled}>
        Load example
      </Button>
    );
  }

  return (
    <Select
      className="w-auto py-0"
      value=""
      disabled={disabled}
      aria-label="Load example"
      onChange={(event) => {
        const match = entries.find(([name]) => name === event.currentTarget.value);

        if (match) {
          onLoad(match[1]);
        }
      }}
    >
      <option value="" disabled>
        Load example…
      </option>
      {entries.map(([name]) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </Select>
  );
}
