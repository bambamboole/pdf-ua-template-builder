import { arrayMove } from "@dnd-kit/sortable";
import type { ReactNode } from "react";
import type { Align, Block, TableBlock, TableColumn } from "../../../types/generated/template";
import { NUMBER_COLUMN_RESERVE, percentWidth } from "../../canvas/columns";
import { isRecord, nextKeyIndex, omitKey, renameKey } from "../../lib/records";
import { AddButton } from "../../primitives/Button";
import { InspectorSection } from "../InspectorShell";
import { setBlockConfigField } from "../../state/configUpdates";
import type { BlockEditorProps } from "./blockEditors";
import { SortableList } from "./SortableList";
import { SortableRow } from "./SortableRow";
import { AlignSelect, Field, Input } from "../../controls";

const hintClass = "m-0 text-2xs text-fg-muted";

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
  const nextIndex = nextKeyIndex(
    columns.map((column) => column.key),
    "column",
  );
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

  if (columns.some((column, currentIndex) => currentIndex !== index && column.key === nextKey)) {
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

export function setTableNumberRows(block: TableBlock, value: boolean | undefined): TableBlock {
  const previousOn = block.config?.numberRows === true;
  const nextOn = value === true;
  const withFlag = setBlockConfigField(block, "numberRows", value);

  if (previousOn === nextOn) {
    return withFlag;
  }

  return adjustFirstColumnWidth(withFlag, nextOn ? -NUMBER_COLUMN_RESERVE : NUMBER_COLUMN_RESERVE);
}

function adjustFirstColumnWidth(block: TableBlock, delta: number): TableBlock {
  const columns = getColumns(block);

  if (columns.length === 0 || !columns.every((column) => percentWidth(column.width) !== null)) {
    return block;
  }

  return applyColumns(
    block,
    columns.map((column, index) => {
      if (index !== 0) {
        return column;
      }

      const current = percentWidth(column.width) ?? 0;
      const next = Math.max(NUMBER_COLUMN_RESERVE, current + delta);

      return { ...column, width: `${next}%` };
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
}: BlockEditorProps): ReactNode {
  const tableBlock = block as TableBlock;
  const columns = getColumns(tableBlock);
  const rows = getRows(rowData);
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

    if (columns.some((column, currentIndex) => currentIndex !== index && column.key === nextKey)) {
      return;
    }

    onChangeBlock(renameColumnKey(tableBlock, index, nextKey));

    if (canEditRows) {
      onChangeRowData?.(renameColumnKeyInRows(rows, previous.key, nextKey));
    }
  }

  return (
    <>
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
    </>
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
  return (
    <InspectorSection title="Columns">
      <SortableList
        count={columns.length}
        onReorder={(source, target) => onChangeBlock(reorderColumns(block, source, target))}
      >
        {columns.map((column, index) => (
          <ColumnRow
            key={columnRowKey(column, index)}
            id={String(index)}
            index={index}
            column={column}
            onChangeKey={(value) => onRenameColumnKey(index, value)}
            onChangeLabel={(value) => onChangeBlock(setColumnLabel(block, index, value))}
            onChangeAlign={(value) => onChangeBlock(setColumnAlign(block, index, value))}
            onRemove={() => onRemoveColumn(index)}
          />
        ))}
      </SortableList>
      <AddButton data-name="add-column" onClick={() => onChangeBlock(addColumn(block))}>
        Add column
      </AddButton>
    </InspectorSection>
  );
}

interface ColumnRowProps {
  id: string;
  index: number;
  column: TableColumn;
  onChangeKey: (value: string) => void;
  onChangeLabel: (value: string) => void;
  onChangeAlign: (value: string) => void;
  onRemove: () => void;
}

function ColumnRow({
  id,
  index,
  column,
  onChangeKey,
  onChangeLabel,
  onChangeAlign,
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
      <div className="grid grid-cols-2 gap-2">
        <Field label="Key">
          <Input
            name={`column-key-${index}`}
            type="text"
            value={column.key}
            onChange={(event) => onChangeKey(event.currentTarget.value)}
          />
        </Field>
        <Field label="Label">
          <Input
            name={`column-label-${index}`}
            type="text"
            value={column.label}
            onChange={(event) => onChangeLabel(event.currentTarget.value)}
          />
        </Field>
        <AlignSelect
          name={`column-align-${index}`}
          value={(column.align ?? "") as string}
          onChange={onChangeAlign}
        />
      </div>
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
  if (!canEditRows) {
    return (
      <InspectorSection title="Rows">
        <p className={hintClass}>Give this block an id to edit runtime row data here.</p>
      </InspectorSection>
    );
  }

  return (
    <InspectorSection title="Rows">
      {rows.length === 0 ? (
        <p className={hintClass}>No rows yet. Add one to seed runtime data for this table.</p>
      ) : (
        <SortableList
          count={rows.length}
          onReorder={(source, target) => onChangeRowData?.(moveRow(rows, source, target))}
        >
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
        </SortableList>
      )}
      <AddButton
        data-name="add-row"
        disabled={columns.length === 0}
        onClick={() => onChangeRowData?.(addRow(rows, columns))}
      >
        Add row
      </AddButton>
    </InspectorSection>
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
      <div className="grid grid-cols-2 gap-2">
        {columns.map((column) => (
          <Field key={column.key} label={column.label || column.key}>
            <Input
              name={`row-${index}.${column.key}`}
              type="text"
              value={row[column.key] ?? ""}
              onChange={(event) => onChangeCell(column.key, event.currentTarget.value)}
            />
          </Field>
        ))}
      </div>
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
