import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties, ReactNode } from "react";
import type { Align, Block, TableBlock } from "../../types/generated/template";
import type { BlockEditorProps } from "./blockEditors";

interface TableColumn {
  key: string;
  label: string;
  align?: Align | null;
  width?: string | null;
}

type TableRow = Record<string, string>;

export function moveColumn(
  columns: readonly TableColumn[],
  sourceIndex: number,
  targetIndex: number,
): TableColumn[] {
  return arrayMove([...columns], sourceIndex, targetIndex);
}

export function moveRow(
  rows: readonly TableRow[],
  sourceIndex: number,
  targetIndex: number,
): TableRow[] {
  return arrayMove([...rows], sourceIndex, targetIndex);
}

export function addColumn(block: TableBlock): TableBlock {
  const columns = getColumns(block);
  const nextIndex = nextColumnIndex(columns);
  const nextColumns: TableColumn[] = [
    ...columns,
    { key: `column${nextIndex}`, label: `Column ${nextIndex}` },
  ];

  return applyColumns(block, nextColumns);
}

export function removeColumn(block: TableBlock, index: number): TableBlock {
  const columns = getColumns(block);

  if (!columns[index]) {
    return block;
  }

  return applyColumns(
    block,
    columns.filter((_, currentIndex) => currentIndex !== index),
  );
}

export function renameColumnKey(
  block: TableBlock,
  index: number,
  nextKey: string,
): TableBlock {
  const columns = getColumns(block);
  const previous = columns[index];

  if (!previous || previous.key === nextKey) {
    return block;
  }

  return applyColumns(
    block,
    columns.map((column, currentIndex) =>
      currentIndex === index ? { ...column, key: nextKey } : column,
    ),
  );
}

export function setColumnLabel(
  block: TableBlock,
  index: number,
  nextLabel: string,
): TableBlock {
  const columns = getColumns(block);

  return applyColumns(
    block,
    columns.map((column, currentIndex) =>
      currentIndex === index ? { ...column, label: nextLabel } : column,
    ),
  );
}

export function setColumnAlign(
  block: TableBlock,
  index: number,
  nextAlign: string,
): TableBlock {
  const columns = getColumns(block);

  return applyColumns(
    block,
    columns.map((column, currentIndex) => {
      if (currentIndex !== index) {
        return column;
      }

      const next: TableColumn = { ...column };
      if (nextAlign === "") {
        delete next.align;
      } else {
        next.align = nextAlign as Align;
      }
      return next;
    }),
  );
}

export function setColumnWidth(
  block: TableBlock,
  index: number,
  nextWidth: string,
): TableBlock {
  const columns = getColumns(block);

  return applyColumns(
    block,
    columns.map((column, currentIndex) => {
      if (currentIndex !== index) {
        return column;
      }

      const next: TableColumn = { ...column };
      if (nextWidth === "") {
        delete next.width;
      } else {
        next.width = nextWidth;
      }
      return next;
    }),
  );
}

export function reorderColumns(
  block: TableBlock,
  sourceIndex: number,
  targetIndex: number,
): TableBlock {
  return applyColumns(block, moveColumn(getColumns(block), sourceIndex, targetIndex));
}

export function addRow(rows: readonly TableRow[], columns: readonly TableColumn[]): TableRow[] {
  const empty: TableRow = Object.fromEntries(columns.map((column) => [column.key, ""]));

  return [...rows, empty];
}

export function removeRow(rows: readonly TableRow[], index: number): TableRow[] {
  return rows.filter((_, currentIndex) => currentIndex !== index);
}

export function setCellValue(
  rows: readonly TableRow[],
  index: number,
  key: string,
  nextValue: string,
): TableRow[] {
  return rows.map((row, currentIndex) =>
    currentIndex === index ? { ...row, [key]: nextValue } : row,
  );
}

export function removeColumnKeyFromRows(
  rows: readonly TableRow[],
  key: string,
): TableRow[] {
  return rows.map((row) => omitKey(row, key));
}

export function renameColumnKeyInRows(
  rows: readonly TableRow[],
  previousKey: string,
  nextKey: string,
): TableRow[] {
  return rows.map((row) => renameKey(row, previousKey, nextKey));
}

export function TableBlockEditor({
  block,
  rowData,
  onChangeBlock,
  onChangeRowData,
  showLayoutControls = true,
}: BlockEditorProps): ReactNode {
  const tableBlock = block as TableBlock;
  const columns = getColumns(tableBlock);
  const rows = getRows(rowData);
  const width = (tableBlock.config?.width ?? "") as string;
  const align = (tableBlock.config?.align ?? "") as Align | "";
  const blockId = typeof tableBlock.id === "string" ? tableBlock.id : "";
  const canEditRows = blockId !== "" && onChangeRowData !== undefined;

  function handleRemoveColumn(index: number): void {
    const removed = columns[index];

    if (!removed) {
      return;
    }

    onChangeBlock(removeColumn(tableBlock, index));

    if (canEditRows) {
      onChangeRowData?.(removeColumnKeyFromRows(rows, removed.key));
    }
  }

  function handleRenameColumnKey(index: number, nextKey: string): void {
    const previous = columns[index];

    if (!previous || previous.key === nextKey) {
      return;
    }

    onChangeBlock(renameColumnKey(tableBlock, index, nextKey));

    if (canEditRows) {
      onChangeRowData?.(renameColumnKeyInRows(rows, previous.key, nextKey));
    }
  }

  function handleChangeWidth(nextWidth: string): void {
    onChangeBlock(setConfigField(tableBlock, "width", nextWidth || undefined));
  }

  function handleChangeAlign(nextAlign: string): void {
    onChangeBlock(setConfigField(tableBlock, "align", nextAlign === "" ? undefined : nextAlign));
  }

  function handleToggleNumberRows(checked: boolean): void {
    onChangeBlock(setConfigField(tableBlock, "numberRows", checked || undefined));
  }

  return (
    <div className="inline-block-form">
      <ColumnsEditor
        block={tableBlock}
        columns={columns}
        onChangeBlock={onChangeBlock}
        onRemoveColumn={handleRemoveColumn}
        onRenameColumnKey={handleRenameColumnKey}
      />

      <RowsEditor
        canEditRows={canEditRows}
        rows={rows}
        columns={columns}
        onChangeRowData={onChangeRowData}
      />

      {showLayoutControls ? (
        <>
          <label className="builder-field builder-field--checkbox">
            <input
              name="config.numberRows"
              type="checkbox"
              checked={tableBlock.config?.numberRows === true}
              onChange={(event) => handleToggleNumberRows(event.currentTarget.checked)}
            />
            Number rows
          </label>

          <label>
            Width
            <input
              name="config.width"
              type="text"
              value={width}
              onChange={(event) => handleChangeWidth(event.currentTarget.value)}
            />
          </label>

          <label>
            Align
            <select
              name="config.align"
              value={align}
              onChange={(event) => handleChangeAlign(event.currentTarget.value)}
            >
              <option value="" />
              <option value="left">left</option>
              <option value="center">center</option>
              <option value="right">right</option>
            </select>
          </label>
        </>
      ) : null}
    </div>
  );
}

interface ColumnsEditorProps {
  block: TableBlock;
  columns: TableColumn[];
  onChangeBlock: (block: Block) => void;
  onRemoveColumn: (index: number) => void;
  onRenameColumnKey: (index: number, nextKey: string) => void;
}

function ColumnsEditor({
  block,
  columns,
  onChangeBlock,
  onRemoveColumn,
  onRenameColumnKey,
}: ColumnsEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const sourceIndex = Number(active.id);
    const targetIndex = Number(over.id);

    if (!Number.isFinite(sourceIndex) || !Number.isFinite(targetIndex)) {
      return;
    }

    onChangeBlock(reorderColumns(block, sourceIndex, targetIndex));
  }

  const sortableIds = columns.map((_, index) => String(index));

  return (
    <fieldset className="builder-array-field">
      <legend>Columns</legend>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {columns.map((column, index) => (
            <ColumnRow
              key={columnRowKey(column, index)}
              id={String(index)}
              index={index}
              column={column}
              onChangeKey={(value) => onRenameColumnKey(index, value)}
              onChangeLabel={(value) => onChangeBlock(setColumnLabel(block, index, value))}
              onChangeAlign={(value) => onChangeBlock(setColumnAlign(block, index, value))}
              onChangeWidth={(value) => onChangeBlock(setColumnWidth(block, index, value))}
              onRemove={() => onRemoveColumn(index)}
            />
          ))}
        </SortableContext>
      </DndContext>
      <button
        type="button"
        data-name="add-column"
        className="builder-array-field__add"
        onClick={() => onChangeBlock(addColumn(block))}
      >
        Add column
      </button>
    </fieldset>
  );
}

interface ColumnRowProps {
  id: string;
  index: number;
  column: TableColumn;
  onChangeKey: (value: string) => void;
  onChangeLabel: (value: string) => void;
  onChangeAlign: (value: string) => void;
  onChangeWidth: (value: string) => void;
  onRemove: () => void;
}

function ColumnRow({
  id,
  index,
  column,
  onChangeKey,
  onChangeLabel,
  onChangeAlign,
  onChangeWidth,
  onRemove,
}: ColumnRowProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      className="builder-array-field__item builder-array-field__item--sortable"
      style={style}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="builder-array-field__handle"
        aria-label={`Drag to reorder column ${index + 1}`}
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <label>
        Key
        <input
          name={`column-key-${index}`}
          type="text"
          value={column.key}
          onChange={(event) => onChangeKey(event.currentTarget.value)}
        />
      </label>
      <label>
        Label
        <input
          name={`column-label-${index}`}
          type="text"
          value={column.label}
          onChange={(event) => onChangeLabel(event.currentTarget.value)}
        />
      </label>
      <label>
        Align
        <select
          name={`column-align-${index}`}
          value={(column.align ?? "") as string}
          onChange={(event) => onChangeAlign(event.currentTarget.value)}
        >
          <option value="" />
          <option value="left">left</option>
          <option value="center">center</option>
          <option value="right">right</option>
        </select>
      </label>
      <label>
        Width
        <input
          name={`column-width-${index}`}
          type="text"
          value={column.width ?? ""}
          onChange={(event) => onChangeWidth(event.currentTarget.value)}
        />
      </label>
      <button
        type="button"
        data-name={`remove-column-${index}`}
        className="builder-array-field__remove"
        aria-label={`Remove column ${index + 1}`}
        onClick={onRemove}
      >
        ✕
      </button>
    </div>
  );
}

interface RowsEditorProps {
  canEditRows: boolean;
  rows: TableRow[];
  columns: TableColumn[];
  onChangeRowData?: (data: unknown) => void;
}

function RowsEditor({ canEditRows, rows, columns, onChangeRowData }: RowsEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;

    if (!over || active.id === over.id || !canEditRows) {
      return;
    }

    const sourceIndex = Number(active.id);
    const targetIndex = Number(over.id);

    if (!Number.isFinite(sourceIndex) || !Number.isFinite(targetIndex)) {
      return;
    }

    onChangeRowData?.(moveRow(rows, sourceIndex, targetIndex));
  }

  if (!canEditRows) {
    return (
      <fieldset className="builder-array-field">
        <legend>Rows</legend>
        <p className="table-block-editor__hint">
          Give this block an id to edit runtime row data here.
        </p>
      </fieldset>
    );
  }

  const sortableIds = rows.map((_, index) => String(index));

  return (
    <fieldset className="builder-array-field">
      <legend>Rows</legend>
      {rows.length === 0 ? (
        <p className="table-block-editor__hint">
          No rows yet. Add one to seed runtime data for this table.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {rows.map((row, rowIndex) => (
              <DataRow
                key={dataRowKey(row, columns, rowIndex)}
                id={String(rowIndex)}
                index={rowIndex}
                row={row}
                columns={columns}
                onChangeCell={(key, value) =>
                  onChangeRowData?.(setCellValue(rows, rowIndex, key, value))
                }
                onRemove={() => onChangeRowData?.(removeRow(rows, rowIndex))}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
      <button
        type="button"
        data-name="add-row"
        className="builder-array-field__add"
        disabled={columns.length === 0}
        onClick={() => onChangeRowData?.(addRow(rows, columns))}
      >
        Add row
      </button>
    </fieldset>
  );
}

interface DataRowProps {
  id: string;
  index: number;
  row: TableRow;
  columns: TableColumn[];
  onChangeCell: (key: string, value: string) => void;
  onRemove: () => void;
}

function DataRow({ id, index, row, columns, onChangeCell, onRemove }: DataRowProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      className="builder-array-field__item builder-array-field__item--sortable"
      style={style}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="builder-array-field__handle"
        aria-label={`Drag to reorder row ${index + 1}`}
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      {columns.map((column) => (
        <label key={column.key}>
          {column.label || column.key}
          <input
            name={`row-${index}.${column.key}`}
            type="text"
            value={row[column.key] ?? ""}
            onChange={(event) => onChangeCell(column.key, event.currentTarget.value)}
          />
        </label>
      ))}
      <button
        type="button"
        data-name={`remove-row-${index}`}
        className="builder-array-field__remove"
        aria-label={`Remove row ${index + 1}`}
        onClick={onRemove}
      >
        ✕
      </button>
    </div>
  );
}

function columnRowKey(column: TableColumn, index: number): string {
  return column.key.length > 0 ? `key:${column.key}` : `index:${index}`;
}

function dataRowKey(row: TableRow, columns: TableColumn[], index: number): string {
  const firstColumn = columns[0];
  const candidate = firstColumn ? row[firstColumn.key] : undefined;

  return typeof candidate === "string" && candidate.length > 0
    ? `first:${candidate}:${index}`
    : `index:${index}`;
}

function getColumns(block: TableBlock): TableColumn[] {
  const candidate = block.config?.columns;

  return Array.isArray(candidate) ? (candidate as TableColumn[]) : [];
}

function getRows(rowData: unknown): TableRow[] {
  if (!Array.isArray(rowData)) {
    return [];
  }

  return rowData.filter((entry): entry is TableRow => isPlainObject(entry)) as TableRow[];
}

function nextColumnIndex(columns: TableColumn[]): number {
  let index = columns.length + 1;

  while (columns.some((column) => column.key === `column${index}`)) {
    index += 1;
  }

  return index;
}

function applyColumns(block: TableBlock, columns: TableColumn[]): TableBlock {
  const config = { ...block.config } as Record<string, unknown>;

  if (columns.length === 0) {
    delete config.columns;
  } else {
    config.columns = columns;
  }

  const nextBlock: TableBlock = {
    ...block,
    config:
      Object.keys(config).length === 0 ? undefined : (config as TableBlock["config"]),
  };

  if (nextBlock.config === undefined) {
    delete (nextBlock as { config?: TableBlock["config"] }).config;
  }

  return nextBlock;
}

function setConfigField(block: TableBlock, key: string, value: unknown): Block {
  const config = { ...block.config } as Record<string, unknown>;

  if (value === undefined) {
    delete config[key];
  } else {
    config[key] = value;
  }

  const nextBlock: TableBlock = {
    ...block,
    config:
      Object.keys(config).length === 0 ? undefined : (config as TableBlock["config"]),
  };

  if (nextBlock.config === undefined) {
    delete (nextBlock as { config?: TableBlock["config"] }).config;
  }

  return nextBlock as Block;
}

function omitKey(row: TableRow, key: string): TableRow {
  if (!(key in row)) {
    return row;
  }

  const next = { ...row };
  delete next[key];
  return next;
}

function renameKey(row: TableRow, previousKey: string, nextKey: string): TableRow {
  if (!(previousKey in row)) {
    return row;
  }

  const next: TableRow = {};
  for (const [key, value] of Object.entries(row)) {
    next[key === previousKey ? nextKey : key] = value;
  }
  return next;
}

function isPlainObject(value: unknown): value is Record<string, string> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
