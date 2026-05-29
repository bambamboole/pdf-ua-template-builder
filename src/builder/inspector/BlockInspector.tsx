import type { Block } from "../../types/generated/template";
import type { TemplateData, TemplateSchemaResponse } from "../../types/template";
import { paletteChipClass } from "../blocks/chipStyles";
import { getBlockChrome, getBlockSummary } from "../blocks/blockChrome";
import type { EditorBlock } from "../state/editorModel";
import { BlockContentControls } from "./BlockContentControls";
import { BlockLayoutControls } from "./BlockLayoutControls";
import {
  inspectorClass,
  inspectorDangerButtonClass,
  inspectorSectionClass,
  inspectorSectionHeadingClass,
  inspectorTitleClass,
} from "./inspectorStyles";
import { SpacingControls } from "./SpacingControls";
import { TypographyControls } from "./TypographyControls";

export interface BlockInspectorProps {
  block: EditorBlock | null;
  schema: TemplateSchemaResponse;
  data: TemplateData;
  onChangeBlock: (blockUid: string, block: Block) => void;
  onChangeData?: (data: TemplateData) => void;
  onRemoveBlock: (blockUid: string) => void;
  onClose: () => void;
}

const shellSections = ["Content", "Layout", "Typography", "Spacing"] as const;

const iconButtonClass =
  "inline-grid h-[22px] w-[22px] cursor-pointer place-items-center rounded border border-solid border-stone-200 bg-white/90 p-0 text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-900";

export function BlockInspector({
  block,
  schema,
  data,
  onChangeBlock,
  onChangeData,
  onRemoveBlock,
  onClose,
}: BlockInspectorProps) {
  if (!block) {
    return (
      <aside className={inspectorClass} aria-label="Block inspector">
        <div className="grid gap-2 text-xs text-stone-500">
          <h2 className={inspectorTitleClass}>Inspector</h2>
          <p className="m-0">Select a block to inspect it.</p>
        </div>
      </aside>
    );
  }

  const chrome = getBlockChrome(block.block.type);
  const summary = getBlockSummary(block.block);
  const blockId = typeof block.block.id === "string" ? block.block.id : null;
  const hasRuntimeData = blockId ? data[blockId] !== undefined : false;
  const schemaSupportsBlock = schema["x-pdfUa"].blockOrder.includes(block.block.type);

  return (
    <aside className={inspectorClass} aria-label="Block inspector">
      <header className="flex min-w-0 items-start justify-between gap-2">
        <div className="flex min-w-0 flex-auto items-start gap-2">
          <span className={paletteChipClass} aria-hidden="true">
            {chrome.chip}
          </span>
          <div>
            <h2 className={inspectorTitleClass}>{chrome.label}</h2>
            {summary ? (
              <p className="mt-0.5 mb-0 break-words text-xs text-stone-500">{summary}</p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          className={iconButtonClass}
          aria-label="Close inspector"
          onClick={onClose}
        >
          ✕
        </button>
      </header>

      <dl className="m-0 grid gap-2">
        <MetaRow label="Type" value={block.block.type} />
        <MetaRow label="ID" value={blockId ?? "Not set"} />
        <MetaRow label="UID" value={block.uid} />
        <MetaRow label="Schema" value={schemaSupportsBlock ? "Available" : "Unsupported"} />
        <MetaRow
          label="Data"
          value={hasRuntimeData ? "Runtime data available" : "No runtime data"}
        />
      </dl>

      <div className="grid gap-2" aria-label="Inspector sections">
        {shellSections.map((section) => (
          <section key={section} className={inspectorSectionClass}>
            <h3 className={inspectorSectionHeadingClass}>{section}</h3>
            {section === "Content" ? (
              <BlockContentControls
                block={block.block}
                rowData={blockId ? data[blockId] : undefined}
                onChangeBlock={(nextBlock) => onChangeBlock(block.uid, nextBlock)}
                onChangeRowData={
                  blockId && onChangeData
                    ? (nextRowData) => onChangeData({ ...data, [blockId]: nextRowData })
                    : undefined
                }
              />
            ) : section === "Layout" ? (
              <BlockLayoutControls
                block={block.block}
                onChangeBlock={(nextBlock) => onChangeBlock(block.uid, nextBlock)}
              />
            ) : section === "Spacing" ? (
              <SpacingControls
                scope="block"
                block={block.block}
                onChangeBlock={(nextBlock) => onChangeBlock(block.uid, nextBlock)}
              />
            ) : section === "Typography" ? (
              <TypographyControls
                target="block"
                block={block.block}
                metadata={schema["x-pdfUa"]}
                onChangeBlock={(nextBlock) => onChangeBlock(block.uid, nextBlock)}
              />
            ) : (
              <p className="m-0 text-xs text-stone-500">
                Controls will be added in a later porting slice.
              </p>
            )}
          </section>
        ))}
      </div>

      <footer className="flex justify-end">
        <button
          type="button"
          className={inspectorDangerButtonClass}
          onClick={() => onRemoveBlock(block.uid)}
        >
          Remove block
        </button>
      </footer>
    </aside>
  );
}

interface MetaRowProps {
  label: string;
  value: string;
}

function MetaRow({ label, value }: MetaRowProps) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] items-baseline gap-2">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">{label}</dt>
      <dd className="m-0 min-w-0 break-words font-mono text-[11px] text-stone-900">{value}</dd>
    </div>
  );
}
