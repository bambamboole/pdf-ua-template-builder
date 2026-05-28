import type { Block } from "../../types/generated/template";
import type { TemplateData, TemplateSchemaResponse } from "../../types/template";
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
      <aside className="builder-inspector" aria-label="Block inspector">
        <div className="builder-inspector__empty">
          <h2 className="builder-inspector__title">Inspector</h2>
          <p>Select a block to inspect it.</p>
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
    <aside className="builder-inspector" aria-label="Block inspector">
      <header className="builder-inspector__header">
        <div className="builder-inspector__heading">
          <span className="builder-chip" aria-hidden="true">
            {chrome.chip}
          </span>
          <div>
            <h2 className="builder-inspector__title">{chrome.label}</h2>
            {summary ? <p className="builder-inspector__summary">{summary}</p> : null}
          </div>
        </div>
        <button
          type="button"
          className="builder-card__icon-button"
          aria-label="Close inspector"
          onClick={onClose}
        >
          ✕
        </button>
      </header>

      <dl className="builder-inspector__meta">
        <div>
          <dt>Type</dt>
          <dd>{block.block.type}</dd>
        </div>
        <div>
          <dt>ID</dt>
          <dd>{blockId ?? "Not set"}</dd>
        </div>
        <div>
          <dt>UID</dt>
          <dd>{block.uid}</dd>
        </div>
        <div>
          <dt>Schema</dt>
          <dd>{schemaSupportsBlock ? "Available" : "Unsupported"}</dd>
        </div>
        <div>
          <dt>Data</dt>
          <dd>{hasRuntimeData ? "Runtime data available" : "No runtime data"}</dd>
        </div>
      </dl>

      <div className="builder-inspector__sections" aria-label="Inspector sections">
        {shellSections.map((section) => (
          <section key={section} className="builder-inspector__section">
            <h3>{section}</h3>
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
              <p>Controls will be added in a later porting slice.</p>
            )}
          </section>
        ))}
      </div>

      <footer className="builder-inspector__footer">
        <button
          type="button"
          className="builder-button builder-button--danger"
          onClick={() => onRemoveBlock(block.uid)}
        >
          Remove block
        </button>
      </footer>
    </aside>
  );
}
