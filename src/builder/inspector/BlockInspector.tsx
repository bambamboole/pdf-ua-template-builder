import { useEffect, useRef, type KeyboardEvent } from "react";
import type { Block } from "../../types/generated/template";
import type { TemplateData, TemplateSchemaResponse } from "../../types/template";
import { Button } from "../primitives/Button";
import { Chip } from "../primitives/Chip";
import { TextField } from "../controls";
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
  className?: string;
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
  className,
}: BlockInspectorProps) {
  const shellRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Move focus into the non-modal flyout when it opens and restore it to the
  // triggering element when it closes, so keyboard users are not stranded.
  useEffect(() => {
    if (!block) {
      return;
    }

    returnFocusRef.current = document.activeElement as HTMLElement | null;
    shellRef.current?.focus();

    return () => {
      returnFocusRef.current?.focus?.();
    };
    // Selecting a different block keeps the panel mounted; only run on open/close.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>): void {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
    }
  }

  if (!block) {
    return (
      <InspectorShell ariaLabel="Block inspector" className={className}>
        <InspectorHeader title="Inspector" />
        <p className="m-0 text-xs text-fg-muted">Select a block to inspect it.</p>
      </InspectorShell>
    );
  }

  const chrome = getBlockChrome(block.block.type);
  const summary = getBlockSummary(block.block);
  const blockId = typeof block.block.id === "string" ? block.block.id : null;
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
    <InspectorShell
      ref={shellRef}
      ariaLabel="Block inspector"
      className={className}
      onKeyDown={handleKeyDown}
    >
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

      <TextField
        name="block.id"
        label="ID"
        value={blockId ?? ""}
        placeholder="Optional identifier"
        onChange={(value) =>
          onChangeBlock(block.uid, { ...block.block, id: value ? value : undefined })
        }
      />

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

