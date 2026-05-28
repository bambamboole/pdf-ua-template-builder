import type { Block } from "../../types/generated/template";
import type { TemplateData, TemplateSchemaResponse } from "../../types/template";
import { paletteChipClass } from "../blocks/BlockPalette";
import { getBlockChrome, getBlockSummary } from "../blocks/blockChrome";
import type { EditorBlock } from "../state/editorModel";
import { BlockContentControls } from "./BlockContentControls";
import { BlockLayoutControls } from "./BlockLayoutControls";
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

export const inspectorClass =
  "col-start-2 row-start-3 grid min-h-0 min-w-0 content-start gap-4 overflow-x-hidden overflow-y-auto border-0 border-l border-solid border-stone-200 bg-white p-4 max-[760px]:col-start-1 max-[760px]:row-auto max-[760px]:border-l-0 max-[760px]:border-t";

export const inspectorTitleClass = "m-0 text-[15px] font-semibold text-stone-900";

const iconButtonClass =
  "inline-grid h-[22px] w-[22px] cursor-pointer place-items-center rounded border border-solid border-stone-200 bg-white/90 p-0 text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-900";

export const inspectorSectionClass =
  "grid min-w-0 gap-1 overflow-hidden rounded-md border border-solid border-stone-200 bg-stone-100 p-3";

export const inspectorSectionHeadingClass = "m-0 text-xs font-semibold text-stone-900";

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
          className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border border-solid border-red-700 bg-red-50 px-3 font-medium whitespace-nowrap text-red-700 transition-colors hover:border-red-700 hover:bg-red-700 hover:text-white"
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
