import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties, RefObject } from "react";
import { Fragment, useRef } from "react";
import type { Block, Orientation, PageFormat } from "../../types/generated/template";
import type { TemplateData, TemplateSchemaResponse } from "../../types/template";
import type {
  EditorArea,
  EditorModel,
  EditorRow,
  PageNumbersValue,
} from "../state/editorModel";
import { selectControlClass } from "../forms/controls/fieldStyles";
import { ColumnResizer } from "./ColumnResizer";
import { gridTemplateForWidths } from "./columns";
import { PageSheet } from "./PageSheet";
import { SortableBlock } from "./SortableBlock";

const pageNumbersSelectClass = `${selectControlClass} text-sm font-normal normal-case tracking-normal`;

export interface BuilderCanvasProps {
  schema: TemplateSchemaResponse;
  model: EditorModel;
  data: TemplateData;
  format: PageFormat;
  orientation: Orientation;
  footerRepeat: boolean;
  pageNumbers: PageNumbersValue;
  selectedBlockUid: string | null;
  onChangeBlock: (blockUid: string, block: Block) => void;
  onRemoveBlock: (blockUid: string) => void;
  onSelectBlock: (blockUid: string) => void;
  onDeselect: () => void;
  onSetRowWidths: (rowUid: string, widths: string[]) => void;
  onChangeData: (data: TemplateData) => void;
  onToggleFooterRepeat: (repeat: boolean) => void;
  onChangePageNumbers: (value: PageNumbersValue) => void;
}

export function BuilderCanvas({
  schema,
  model,
  data,
  format,
  orientation,
  footerRepeat,
  pageNumbers,
  selectedBlockUid,
  onChangeBlock,
  onRemoveBlock,
  onSelectBlock,
  onDeselect,
  onSetRowWidths,
  onChangeData,
  onToggleFooterRepeat,
  onChangePageNumbers,
}: BuilderCanvasProps) {
  return (
    <div
      className="col-start-1 row-start-3 min-w-0 min-h-0 overflow-auto bg-stone-200 px-4 pb-8 pt-6 max-[760px]:col-span-1 max-[760px]:row-auto"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          onDeselect();
        }
      }}
    >
      <PageSheet format={format} orientation={orientation}>
        <CanvasArea
          area="body"
          rows={model.rows}
          schema={schema}
          data={data}
          selectedBlockUid={selectedBlockUid}
          newRowId="new-row"
          emptyLabel="Drop a block here to begin"
          fillLabel="Drop a block here to add a new row"
          onChangeBlock={onChangeBlock}
          onRemoveBlock={onRemoveBlock}
          onSelectBlock={onSelectBlock}
          onSetRowWidths={onSetRowWidths}
          onChangeData={onChangeData}
        />

        <section
          className="mt-6 grid gap-3 border-0 border-t border-dashed border-stone-200 pt-4"
          aria-label="Page footer"
        >
          <header className="flex items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-[11px] font-semibold uppercase tracking-[0.06em] text-stone-400">
                Footer
              </h2>
              <p className="mt-0.5 m-0 text-[11px] text-stone-400">
                Repeated content rendered in the page footer area.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-stone-500">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-indigo-600"
                checked={footerRepeat}
                onChange={(event) => onToggleFooterRepeat(event.currentTarget.checked)}
              />
              Repeat on every page
            </label>
          </header>

          <CanvasArea
            area="footer"
            rows={model.footerRows}
            schema={schema}
            data={data}
            selectedBlockUid={selectedBlockUid}
            newRowId="new-footer-row"
            emptyLabel="Drop a block here to start the footer"
            fillLabel="Drop a block here to add a footer row"
            onChangeBlock={onChangeBlock}
            onRemoveBlock={onRemoveBlock}
            onSelectBlock={onSelectBlock}
            onSetRowWidths={onSetRowWidths}
            onChangeData={onChangeData}
          />

          <footer className="mt-2 flex justify-center border-0 border-t border-dashed border-stone-200 pt-3">
            <label className="inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.06em] text-stone-500">
              Page numbers
              <select
                className={pageNumbersSelectClass}
                value={pageNumbers}
                onChange={(event) =>
                  onChangePageNumbers(event.currentTarget.value as PageNumbersValue)
                }
              >
                <option value="disabled">Disabled</option>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
          </footer>
        </section>
      </PageSheet>
    </div>
  );
}

interface CanvasAreaProps {
  area: EditorArea;
  rows: EditorRow[];
  schema: TemplateSchemaResponse;
  data: TemplateData;
  selectedBlockUid: string | null;
  newRowId: string;
  emptyLabel: string;
  fillLabel: string;
  onChangeBlock: (blockUid: string, block: Block) => void;
  onRemoveBlock: (blockUid: string) => void;
  onSelectBlock: (blockUid: string) => void;
  onSetRowWidths: (rowUid: string, widths: string[]) => void;
  onChangeData: (data: TemplateData) => void;
}

function CanvasArea({
  area,
  rows,
  schema,
  data,
  selectedBlockUid,
  newRowId,
  emptyLabel,
  fillLabel,
  onChangeBlock,
  onRemoveBlock,
  onSelectBlock,
  onSetRowWidths,
  onChangeData,
}: CanvasAreaProps) {
  const { setNodeRef: setNewRowRef, isOver: isNewRowOver } = useDroppable({
    id: newRowId,
    data: { type: "new-row", area },
  });

  return (
    <div className="grid gap-3">
      <SortableContext
        items={rows.map((row) => row.uid)}
        strategy={verticalListSortingStrategy}
      >
        {rows.map((row) => (
          <CanvasRow
            key={row.uid}
            row={row}
            area={area}
            schema={schema}
            data={data}
            selectedBlockUid={selectedBlockUid}
            onChangeBlock={onChangeBlock}
            onRemoveBlock={onRemoveBlock}
            onSelectBlock={onSelectBlock}
            onSetRowWidths={onSetRowWidths}
            onChangeData={onChangeData}
          />
        ))}
      </SortableContext>

      <div
        ref={setNewRowRef}
        className={
          isNewRowOver
            ? "grid min-h-10 place-items-center rounded-lg border border-dashed border-indigo-600 bg-indigo-50 p-3 text-sm text-indigo-600 transition-[border-color,background,color]"
            : "grid min-h-10 place-items-center rounded-lg border border-dashed border-stone-300 bg-transparent p-3 text-sm text-stone-400 transition-[border-color,background,color]"
        }
      >
        {rows.length === 0 ? emptyLabel : fillLabel}
      </div>
    </div>
  );
}

interface CanvasRowProps {
  row: EditorRow;
  area: EditorArea;
  schema: TemplateSchemaResponse;
  data: TemplateData;
  selectedBlockUid: string | null;
  onChangeBlock: (blockUid: string, block: Block) => void;
  onRemoveBlock: (blockUid: string) => void;
  onSelectBlock: (blockUid: string) => void;
  onSetRowWidths: (rowUid: string, widths: string[]) => void;
  onChangeData: (data: TemplateData) => void;
}

function CanvasRow({
  row,
  area,
  schema,
  data,
  selectedBlockUid,
  onChangeBlock,
  onRemoveBlock,
  onSelectBlock,
  onSetRowWidths,
  onChangeData,
}: CanvasRowProps) {
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
      area,
    },
  });
  const widths = getRowWidths(row);
  const canResizeColumns = row.blocks.length > 1;
  const gridTemplateColumns = gridTemplateForWidths(
    canResizeColumns ? (widths ?? []) : widths,
    row.blocks.length,
  );
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <section
      ref={setNodeRef}
      className={
        isDragging
          ? "group/row grid min-w-0 gap-2 rounded-lg opacity-50 transition-[background]"
          : "group/row grid min-w-0 gap-2 rounded-lg transition-[background]"
      }
      style={style}
    >
      <div className="-mb-0.5 flex h-[22px] items-center gap-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover/row:opacity-100">
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="inline-flex h-[22px] cursor-grab items-center border-0 bg-transparent px-2 font-mono text-[11px] text-stone-400 hover:text-stone-900"
          aria-label="Drag to move row"
          {...attributes}
          {...listeners}
        >
          ⋮⋮ row
        </button>
      </div>
      <div
        ref={rowRef}
        className="relative grid min-w-0 items-stretch gap-2 max-[480px]:!grid-cols-1"
        style={gridTemplateColumns ? { gridTemplateColumns } : undefined}
      >
        <SortableContext items={row.blocks.map((block) => block.uid)}>
          {row.blocks.map((editorBlock, index) => (
            <Fragment key={editorBlock.uid}>
              <SortableBlock
                rowUid={row.uid}
                area={area}
                editorBlock={editorBlock}
                schema={schema}
                data={data}
                selected={editorBlock.uid === selectedBlockUid}
                onChangeBlock={onChangeBlock}
                onRemoveBlock={onRemoveBlock}
                onSelect={onSelectBlock}
                onChangeData={onChangeData}
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

function getRowWidths(row: EditorRow): string[] | null {
  const widths = row.blocks.map((editorBlock) => editorBlock.block.config?.width);

  return widths.every((width): width is string => typeof width === "string") ? widths : null;
}
