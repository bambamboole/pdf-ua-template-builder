import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { CSSProperties, RefObject } from "react";
import { Fragment, useRef } from "react";
import type { Block } from "../../types/generated/template";
import type { TemplateSchemaResponse } from "../../types/template";
import { InlineBlockForm } from "../forms/InlineBlockForm";
import {
  getBlockConfigSchema,
  getBlockFieldSchema,
  type JsonSchemaObject,
} from "../schema/schemaAdapter";
import type { EditorBlock, EditorModel, EditorRow } from "../state/editorModel";
import { ColumnResizer } from "./ColumnResizer";
import { gridTemplateForWidths } from "./columns";

export interface BuilderCanvasProps {
  schema: TemplateSchemaResponse;
  model: EditorModel;
  onChangeBlock: (blockUid: string, block: Block) => void;
  onRemoveBlock: (blockUid: string) => void;
  onSetRowWidths: (rowUid: string, widths: string[]) => void;
}

export function BuilderCanvas({
  schema,
  model,
  onChangeBlock,
  onRemoveBlock,
  onSetRowWidths,
}: BuilderCanvasProps) {
  const { setNodeRef: setNewRowRef, isOver: isNewRowOver } = useDroppable({
    id: "new-row",
    data: {
      type: "new-row",
    },
  });

  return (
    <div className="builder-canvas">
      <SortableContext
        items={model.rows.map((row) => row.uid)}
        strategy={verticalListSortingStrategy}
      >
        {model.rows.map((row) => (
          <CanvasRow
            key={row.uid}
            row={row}
            schema={schema}
            onChangeBlock={onChangeBlock}
            onRemoveBlock={onRemoveBlock}
            onSetRowWidths={onSetRowWidths}
          />
        ))}
      </SortableContext>

      <div
        ref={setNewRowRef}
        className={isNewRowOver ? "builder-canvas__new-row is-over" : "builder-canvas__new-row"}
      >
        Drop block here to add a row
      </div>
    </div>
  );
}

interface CanvasRowProps {
  row: EditorRow;
  schema: TemplateSchemaResponse;
  onChangeBlock: (blockUid: string, block: Block) => void;
  onRemoveBlock: (blockUid: string) => void;
  onSetRowWidths: (rowUid: string, widths: string[]) => void;
}

function CanvasRow({ row, schema, onChangeBlock, onRemoveBlock, onSetRowWidths }: CanvasRowProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.uid,
    data: {
      type: "row",
      rowUid: row.uid,
    },
  });
  const widths = getRowWidths(row);
  const canResizeColumns = row.blocks.length > 1;
  const gridTemplateColumns = gridTemplateForWidths(
    canResizeColumns ? (widths ?? []) : widths,
    row.blocks.length,
  );

  return (
    <section
      ref={setNodeRef}
      className={isDragging ? "builder-canvas__row is-dragging" : "builder-canvas__row"}
      style={sortableStyle(transform, transition)}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="builder-canvas__row-handle"
        {...attributes}
        {...listeners}
      >
        Row
      </button>
      <div
        ref={rowRef}
        className="builder-canvas__columns"
        style={gridTemplateColumns ? { gridTemplateColumns } : undefined}
      >
        <SortableContext items={row.blocks.map((block) => block.uid)}>
          {row.blocks.map((editorBlock, index) => (
            <Fragment key={editorBlock.uid}>
              <SortableBlock
                rowUid={row.uid}
                editorBlock={editorBlock}
                schema={schema}
                onChangeBlock={onChangeBlock}
                onRemoveBlock={onRemoveBlock}
              />
              {canResizeColumns && index < row.blocks.length - 1 ? (
                <ColumnResizer
                  key={`${editorBlock.uid}:resizer`}
                  widths={widths}
                  count={row.blocks.length}
                  leftIndex={index}
                  containerRef={rowRef as RefObject<HTMLElement | null>}
                  onResize={(nextWidths) => onSetRowWidths(row.uid, nextWidths)}
                />
              ) : null}
            </Fragment>
          ))}
        </SortableContext>
      </div>
    </section>
  );
}

interface SortableBlockProps {
  rowUid: string;
  editorBlock: EditorBlock;
  schema: TemplateSchemaResponse;
  onChangeBlock: (blockUid: string, block: Block) => void;
  onRemoveBlock: (blockUid: string) => void;
}

function SortableBlock({
  rowUid,
  editorBlock,
  schema,
  onChangeBlock,
  onRemoveBlock,
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
    },
  });
  const schemaObject = schema as unknown as JsonSchemaObject;
  const fieldSchema = getBlockFieldSchema(schemaObject, editorBlock.block.type);
  const configSchema = getBlockConfigSchema(schemaObject, editorBlock.block.type);

  return (
    <article
      ref={setNodeRef}
      className={isDragging ? "builder-canvas__block is-dragging" : "builder-canvas__block"}
      style={sortableStyle(transform, transition)}
    >
      <div className="builder-canvas__block-toolbar">
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="builder-canvas__block-handle"
          {...attributes}
          {...listeners}
        >
          {editorBlock.block.type}
        </button>
        <button type="button" onClick={() => onRemoveBlock(editorBlock.uid)}>
          Remove
        </button>
      </div>
      <InlineBlockForm
        block={editorBlock.block}
        fieldSchema={fieldSchema}
        configSchema={configSchema}
        onChange={(block) => onChangeBlock(editorBlock.uid, block)}
      />
    </article>
  );
}

function getRowWidths(row: EditorRow): string[] | null {
  const widths = row.blocks.map((editorBlock) => editorBlock.block.config?.width);

  return widths.every((width): width is string => typeof width === "string") ? widths : null;
}

function sortableStyle(
  transform: { x: number; y: number; scaleX?: number; scaleY?: number } | null,
  transition: string | undefined,
): CSSProperties {
  return {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };
}
