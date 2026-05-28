import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import type { EditorArea, EditorBlock } from "../state/editorModel";
import type { Block } from "../../types/generated/template";
import type { TemplateData, TemplateSchemaResponse } from "../../types/template";
import { BlockDataPreview } from "./BlockDataPreview";

export interface SortableBlockProps {
  rowUid: string;
  area: EditorArea;
  editorBlock: EditorBlock;
  schema: TemplateSchemaResponse;
  data: TemplateData;
  selected: boolean;
  onChangeBlock: (blockUid: string, block: Block) => void;
  onRemoveBlock: (blockUid: string) => void;
  onSelect: (blockUid: string) => void;
  onChangeData: (data: TemplateData) => void;
  style?: CSSProperties;
}

export function SortableBlock({
  rowUid,
  area,
  editorBlock,
  schema,
  data,
  selected,
  onChangeBlock,
  onRemoveBlock,
  onSelect,
  onChangeData,
  style: layoutStyle,
}: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: editorBlock.uid,
    data: {
      type: "block",
      rowUid,
      blockUid: editorBlock.uid,
      area,
    },
  });

  void schema;
  void onChangeBlock;
  void onChangeData;

  const blockId = typeof editorBlock.block.id === "string" ? editorBlock.block.id : null;
  const rowData = blockId ? data[blockId] : undefined;
  const classes = [
    "builder-card",
    isDragging ? "is-dragging" : "",
    selected ? "is-selected" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...layoutStyle,
  };

  function selectBlock() {
    onSelect(editorBlock.uid);
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectBlock();
    }
  }

  function handleRemove(event: MouseEvent) {
    event.stopPropagation();
    onRemoveBlock(editorBlock.uid);
  }

  return (
    <article
      ref={setNodeRef}
      className={classes}
      style={style}
      aria-current={selected}
      tabIndex={0}
      onClick={selectBlock}
      onKeyDown={handleCardKeyDown}
    >
      <div className="builder-card__chrome">
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="builder-card__handle"
          aria-label="Drag to move block"
          onClick={(event) => event.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
        <div className="builder-card__actions">
          <button
            type="button"
            className="builder-card__icon-button builder-card__icon-button--danger"
            aria-label="Remove block"
            onClick={handleRemove}
          >
            ✕
          </button>
        </div>
      </div>
      <div className="builder-card-preview">
        <BlockDataPreview block={editorBlock.block} rowData={rowData} />
      </div>
    </article>
  );
}
