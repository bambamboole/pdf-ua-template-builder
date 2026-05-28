import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import { getBlockChrome, getBlockSummary } from "../blocks/blockChrome";
import { InlineBlockForm } from "../forms/InlineBlockForm";
import {
  getBlockDefinition,
  getBlockConfigSchema,
  getBlockFieldSchema,
  type JsonSchemaObject,
} from "../schema/schemaAdapter";
import type { EditorArea, EditorBlock } from "../state/editorModel";
import type { Block } from "../../types/generated/template";
import type { TemplateSchemaResponse } from "../../types/template";

export interface SortableBlockProps {
  rowUid: string;
  area: EditorArea;
  editorBlock: EditorBlock;
  schema: TemplateSchemaResponse;
  onChangeBlock: (blockUid: string, block: Block) => void;
  onRemoveBlock: (blockUid: string) => void;
  style?: CSSProperties;
}

export function SortableBlock({
  rowUid,
  area,
  editorBlock,
  schema,
  onChangeBlock,
  onRemoveBlock,
  style: layoutStyle,
}: SortableBlockProps) {
  const [expanded, setExpanded] = useState(false);
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

  const schemaObject = schema as unknown as JsonSchemaObject;
  const isKnownType = getBlockDefinition(schemaObject, editorBlock.block.type) !== undefined;
  const fieldSchema = isKnownType
    ? getBlockFieldSchema(schemaObject, editorBlock.block.type)
    : null;
  const configSchema = isKnownType
    ? getBlockConfigSchema(schemaObject, editorBlock.block.type)
    : undefined;
  const chrome = getBlockChrome(editorBlock.block.type);
  const summary = getBlockSummary(editorBlock.block);
  const classes = [
    "builder-card",
    isDragging ? "is-dragging" : "",
    expanded ? "is-expanded" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...layoutStyle,
  };

  function toggleExpanded() {
    setExpanded((value) => !value);
  }

  function handleHeaderKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleExpanded();
    }
  }

  function handleRemove(event: MouseEvent) {
    event.stopPropagation();
    onRemoveBlock(editorBlock.uid);
  }

  return (
    <article ref={setNodeRef} className={classes} style={style}>
      <div
        className="builder-card__header"
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={toggleExpanded}
        onKeyDown={handleHeaderKeyDown}
      >
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
        <span className="builder-chip" aria-hidden="true">
          {chrome.chip}
        </span>
        <div className="builder-card__title">
          <span className="builder-card__label">{chrome.label}</span>
          {summary ? <span className="builder-card__summary">{summary}</span> : null}
        </div>
        <div className="builder-card__actions">
          <button
            type="button"
            className="builder-card__icon-button"
            aria-label={expanded ? "Collapse block" : "Expand block"}
            onClick={(event) => {
              event.stopPropagation();
              toggleExpanded();
            }}
          >
            {expanded ? "▴" : "▾"}
          </button>
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
      {expanded ? (
        <div className="builder-card__form">
          {fieldSchema ? (
            <InlineBlockForm
              block={editorBlock.block}
              fieldSchema={fieldSchema}
              configSchema={configSchema}
              onChange={(block) => onChangeBlock(editorBlock.uid, block)}
            />
          ) : (
            <p className="builder-card__warning">
              The backend schema does not advertise <code>{editorBlock.block.type}</code>. Update or
              restart the API to edit this block.
            </p>
          )}
        </div>
      ) : null}
    </article>
  );
}
