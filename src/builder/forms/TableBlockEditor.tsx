import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { ReactNode } from "react";
import type { Align, Block, TableBlock } from "../../types/generated/template";
import { isRecord, omitKey, renameKey } from "../lib/records";
import { useBuilderSensors } from "../lib/sensors";
import { setBlockConfigValue, type BlockEditorProps } from "./blockEditors";
import { SortableRow } from "./SortableRow";
import { AlignSelect } from "./controls";
import {
  arrayAddClass as arrayAddBaseClass,
  arrayFieldClass,
  arrayLegendClass,
  checkboxClass,
  checkboxLabelClass,
  controlClass,
  fieldLabelClass,
} from "./controls/fieldStyles";

const arrayAddClass = `${arrayAddBaseClass} disabled:cursor-not-allowed disabled:opacity-50`;

const hintClass = "m-0 text-2xs text-stone-500";

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
    onChangeBlock(setBlockConfigValue(tableBlock, "width", nextWidth || undefined));
  }

  function handleChangeAlign(nextAlign: string): void {
    onChangeBlock(setBlockConfigValue(tableBlock, "align", nextAlign === "" ? undefined : nextAlign));
  }

  function handleToggleNumberRows(checked: boolean): void {
    onChangeBlock(setBlockConfigValue(tableBlock, "numberRows", checked || undefined));
  }

  return (
    <div className="grid gap-3 [container-type:inline-size]">
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
          <label className={checkboxLabelClass}>
            <input
              className={checkboxClass}
              name="config.numberRows"
              type="checkbox"
              checked={tableBlock.config?.numberRows === true}
              onChange={(event) => handleToggleNumberRows(event.currentTarget.checked)}
            />
            Number rows
          </label>

          <label className={fieldLabelClass}>
            Width
            <input
              className={controlClass}
              name="config.width"
              type="text"
              value={width}
              onChange={(event) => handleChangeWidth(event.currentTarget.value)}
            />
          </label>

          <AlignSelect name="config.align" value={align} onChange={handleChangeAlign} />
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
  const sensors = useBuilderSensors();

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
    <fieldset className={arrayFieldClass}>
      <legend className={arrayLegendClass}>Columns</legend>
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
        className={arrayAddClass}
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
  return (
    <SortableRow
      id={id}
      dragLabel={`Drag to reorder column ${index + 1}`}
      removeLabel={`Remove column ${index + 1}`}
      removeName={`remove-column-${index}`}
      onRemove={onRemove}
    >
      <label className={fieldLabelClass}>
        Key
        <input
          className={controlClass}
          name={`column-key-${index}`}
          type="text"
          value={column.key}
          onChange={(event) => onChangeKey(event.currentTarget.value)}
        />
      </label>
      <label className={fieldLabelClass}>
        Label
        <input
          className={controlClass}
          name={`column-label-${index}`}
          type="text"
          value={column.label}
          onChange={(event) => onChangeLabel(event.currentTarget.value)}
        />
      </label>
      <AlignSelect
        name={`column-align-${index}`}
        value={(column.align ?? "") as string}
        onChange={onChangeAlign}
      />
      <label className={fieldLabelClass}>
        Width
        <input
          className={controlClass}
          name={`column-width-${index}`}
          type="text"
          value={column.width ?? ""}
          onChange={(event) => onChangeWidth(event.currentTarget.value)}
        />
      </label>
    </SortableRow>
  );
}

interface RowsEditorProps {
  canEditRows: boolean;
  rows: TableRow[];
  columns: TableColumn[];
  onChangeRowData?: (data: unknown) => void;
}

function RowsEditor({ canEditRows, rows, columns, onChangeRowData }: RowsEditorProps) {
  const sensors = useBuilderSensors();

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
      <fieldset className={arrayFieldClass}>
        <legend className={arrayLegendClass}>Rows</legend>
        <p className={hintClass}>Give this block an id to edit runtime row data here.</p>
      </fieldset>
    );
  }

  const sortableIds = rows.map((_, index) => String(index));

  return (
    <fieldset className={arrayFieldClass}>
      <legend className={arrayLegendClass}>Rows</legend>
      {rows.length === 0 ? (
        <p className={hintClass}>No rows yet. Add one to seed runtime data for this table.</p>
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
        className={arrayAddClass}
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
  return (
    <SortableRow
      id={id}
      dragLabel={`Drag to reorder row ${index + 1}`}
      removeLabel={`Remove row ${index + 1}`}
      removeName={`remove-row-${index}`}
      onRemove={onRemove}
    >
      {columns.map((column) => (
        <label key={column.key} className={fieldLabelClass}>
          {column.label || column.key}
          <input
            className={controlClass}
            name={`row-${index}.${column.key}`}
            type="text"
            value={row[column.key] ?? ""}
            onChange={(event) => onChangeCell(column.key, event.currentTarget.value)}
          />
        </label>
      ))}
    </SortableRow>
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

  return rowData.filter((entry): entry is TableRow => isRecord(entry)) as TableRow[];
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
