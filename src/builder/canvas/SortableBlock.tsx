import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import type { Block } from "../../types/generated/template";
import type { EditorArea, EditorBlock } from "../state/editorModel";
import type { TemplateData } from "../../types/template";
import { BlockDataPreview } from "./BlockDataPreview";

export interface SortableBlockProps {
  rowUid: string;
  area: EditorArea;
  editorBlock: EditorBlock;
  data: TemplateData;
  selected: boolean;
  onRemoveBlock: (blockUid: string) => void;
  onSelect: (blockUid: string) => void;
  onChangeBlock: (blockUid: string, block: Block) => void;
  style?: CSSProperties;
}

export function SortableBlock({
  rowUid,
  area,
  editorBlock,
  data,
  selected,
  onRemoveBlock,
  onSelect,
  onChangeBlock,
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

  const blockId = typeof editorBlock.block.id === "string" ? editorBlock.block.id : null;
  const rowData = blockId ? data[blockId] : undefined;
  const classes = [
    "group/card relative grid min-w-0 cursor-pointer overflow-hidden rounded-lg border border-solid bg-surface transition-[border-color,box-shadow,background] hover:border-border-strong",
    isDragging ? "border-dashed border-border opacity-45" : "border-border",
    selected ? "!border-accent ring-2 ring-accent-soft" : "",
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

  const chromeRevealedClass = selected || isDragging ? "opacity-100" : "opacity-0";

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
      <div
        className={`pointer-events-none absolute inset-x-2 top-2 z-[1] flex items-center justify-between gap-1 transition-opacity group-hover/card:opacity-100 group-focus-within/card:opacity-100 ${chromeRevealedClass}`}
      >
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="pointer-events-auto inline-grid h-[22px] w-[22px] flex-none cursor-grab place-items-center rounded border border-solid border-border bg-surface/90 p-0 font-mono text-xs text-fg-subtle transition-[background,border-color,color] hover:border-border-strong hover:bg-surface hover:text-fg active:cursor-grabbing"
          aria-label="Drag to move block"
          onClick={(event) => event.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
        <div className="pointer-events-auto inline-flex flex-none items-center gap-1">
          <button
            type="button"
            className="inline-grid h-[22px] w-[22px] cursor-pointer place-items-center rounded border border-solid border-border bg-surface/90 p-0 text-[13px] text-fg-muted transition-[background,border-color,color] hover:border-border-strong hover:bg-danger-soft hover:text-danger"
            aria-label="Remove block"
            onClick={handleRemove}
          >
            ✕
          </button>
        </div>
      </div>
      <div className="grid min-w-0 bg-surface p-3">
        <BlockDataPreview
          block={editorBlock.block}
          rowData={rowData}
          onChange={(block) => onChangeBlock(editorBlock.uid, block)}
        />
      </div>
    </article>
  );
}
