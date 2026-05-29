import type { Block } from "../../types/generated/template";
import type { TemplateData, TemplateSchemaResponse } from "../../types/template";
import { Button } from "../primitives/Button";
import { Chip } from "../primitives/Chip";
import { getBlockChrome, getBlockSummary } from "../blocks/blockChrome";
import type { EditorBlock } from "../state/editorModel";
import { BlockContentControls } from "./BlockContentControls";
import { BlockLayoutControls } from "./BlockLayoutControls";
import { InspectorHeader, InspectorSection, InspectorShell } from "./InspectorShell";
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

const detailSections = ["Layout", "Typography", "Spacing"] as const;

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
      <InspectorShell ariaLabel="Block inspector">
        <InspectorHeader title="Inspector" />
        <p className="m-0 text-xs text-fg-muted">Select a block to inspect it.</p>
      </InspectorShell>
    );
  }

  const chrome = getBlockChrome(block.block.type);
  const summary = getBlockSummary(block.block);
  const blockId = typeof block.block.id === "string" ? block.block.id : null;
  const hasRuntimeData = blockId ? data[blockId] !== undefined : false;
  const schemaSupportsBlock = schema["x-pdfUa"].blockOrder.includes(block.block.type);
  const contentControls = (
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
  );

  return (
    <InspectorShell ariaLabel="Block inspector">
      <InspectorHeader
        chip={<Chip>{chrome.chip}</Chip>}
        title={chrome.label}
        subtitle={summary || undefined}
        action={
          <button
            type="button"
            className="inline-grid h-[22px] w-[22px] cursor-pointer place-items-center rounded border border-solid border-border bg-surface/90 p-0 text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
            aria-label="Close inspector"
            onClick={onClose}
          >
            ✕
          </button>
        }
      />

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
        {contentControls}
        {detailSections.map((section) => (
          <InspectorSection key={section} title={section}>
            {section === "Layout" ? (
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
            ) : (
              <TypographyControls
                target="block"
                block={block.block}
                metadata={schema["x-pdfUa"]}
                onChangeBlock={(nextBlock) => onChangeBlock(block.uid, nextBlock)}
              />
            )}
          </InspectorSection>
        ))}
      </div>

      <footer className="flex justify-end">
        <Button variant="danger" onClick={() => onRemoveBlock(block.uid)}>
          Remove block
        </Button>
      </footer>
    </InspectorShell>
  );
}

interface MetaRowProps {
  label: string;
  value: string;
}

function MetaRow({ label, value }: MetaRowProps) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] items-baseline gap-2">
      <dt className="text-2xs font-semibold uppercase tracking-wide text-fg-subtle">{label}</dt>
      <dd className="m-0 min-w-0 break-words font-mono text-2xs text-fg">{value}</dd>
    </div>
  );
}
