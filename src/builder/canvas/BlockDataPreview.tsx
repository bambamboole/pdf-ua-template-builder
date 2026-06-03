import { useRef, type ReactNode } from "react";
import type {
  Block,
  BarcodeBlock,
  DividerBlock,
  HeadingBlock,
  HtmlBlock,
  ImageBlock,
  KeyValueBlock,
  KeyValueValues,
  SpacerBlock,
  TableBlock,
  TextBlock,
} from "../../types/generated/template";
import { describeBarcodeContent, symbologyLabel } from "../blocks/barcode";
import { isRecord } from "../lib/records";
import { setBlockField } from "../state/configUpdates";
import { ColumnResizer } from "./ColumnResizer";
import { formatWidths, labelWidthPercent, tableColumnTracks } from "./columns";

export interface BlockDataPreviewProps {
  block: Block;
  rowData?: unknown;
  onChange?: (block: Block) => void;
}

const copyClass =
  "m-0 line-clamp-3 overflow-hidden text-sm leading-[1.45] text-fg-muted [display:-webkit-box] [-webkit-box-orient:vertical]";
const headingCopyClass =
  "m-0 line-clamp-2 overflow-hidden text-[17px] font-semibold leading-[1.25] text-fg [display:-webkit-box] [-webkit-box-orient:vertical]";

function EmptyPreview({ children }: { children: ReactNode }) {
  return <p className="m-0 text-sm text-fg-subtle">{children}</p>;
}

export function BlockDataPreview({ block, rowData, onChange }: BlockDataPreviewProps) {
  switch (block.type) {
    case "heading":
      return <TextPreview block={block} variant="heading" />;
    case "text":
      return <TextPreview block={block} variant="text" />;
    case "html":
      return <HtmlPreview block={block} />;
    case "image":
      return <ImagePreview block={block} />;
    case "barcode":
      return <BarcodePreview block={block} />;
    case "key-value":
      return <KeyValuePreview block={block} rowData={rowData} onChange={onChange} />;
    case "table":
      return <TablePreview block={block} rowData={rowData} onChange={onChange} />;
    case "spacer":
      return <SpacerPreview block={block} />;
    case "divider":
      return <DividerPreview block={block} />;
    default:
      return null;
  }
}

function BarcodePreview({ block }: { block: BarcodeBlock }) {
  const content = describeBarcodeContent(block.content).trim();

  return (
    <div className="grid gap-2 rounded-md border border-solid border-border bg-surface-muted p-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="inline-grid h-8 w-8 flex-none place-items-center rounded border border-solid border-border bg-surface font-mono text-sm text-fg">
          ▥
        </span>
        <div className="min-w-0">
          <p className="m-0 text-sm font-medium text-fg">{symbologyLabel(block.symbology)}</p>
          <p className="m-0 text-2xs text-fg-muted">{block.content.type}</p>
        </div>
      </div>
      {content ? (
        <p className={copyClass}>{content}</p>
      ) : (
        <EmptyPreview>No barcode content yet</EmptyPreview>
      )}
    </div>
  );
}

function TextPreview({
  block,
  variant,
}: {
  block: TextBlock | HeadingBlock;
  variant: "text" | "heading";
}) {
  const text = block.text.trim();

  if (text.length === 0) {
    return <EmptyPreview>No text yet</EmptyPreview>;
  }

  return <p className={variant === "heading" ? headingCopyClass : copyClass}>{text}</p>;
}

function HtmlPreview({ block }: { block: HtmlBlock }) {
  const text = stripMarkup(block.html).trim();

  if (text.length === 0) {
    return <EmptyPreview>No HTML content yet</EmptyPreview>;
  }

  return <p className={copyClass}>{text}</p>;
}

function ImagePreview({ block }: { block: ImageBlock }) {
  const src = block.src.trim();

  if (src.length === 0) {
    return <EmptyPreview>No image selected</EmptyPreview>;
  }

  return (
    <div className="grid min-h-[72px] place-items-center overflow-hidden rounded-md border border-solid border-border bg-surface-muted">
      <img
        className="block max-h-[120px] max-w-full object-contain"
        src={src}
        alt={block.alt ?? ""}
      />
    </div>
  );
}

function KeyValuePreview({
  block,
  rowData,
  onChange,
}: {
  block: KeyValueBlock;
  rowData?: unknown;
  onChange?: (block: Block) => void;
}) {
  const listRef = useRef<HTMLDListElement | null>(null);
  const fields = block.fields ?? [];
  const values = mergeRecordValues(block.values, rowData);
  const entries =
    fields.length > 0
      ? fields.map((field) => ({
          key: field.key,
          label: field.label || field.key,
          value: stringifyPreviewValue(values[field.key]),
        }))
      : Object.entries(values).map(([key, value]) => ({
          key,
          label: key,
          value: stringifyPreviewValue(value),
        }));

  if (entries.length === 0) {
    return <EmptyPreview>No fields yet</EmptyPreview>;
  }

  const labelPercent = labelWidthPercent(block.labelWidth);
  const columnsStyle = { gridTemplateColumns: `${labelPercent}% minmax(0, 1fr)` };

  return (
    <dl ref={listRef} className="relative m-0 grid gap-0.5">
      {entries.slice(0, 5).map((entry) => (
        <div key={entry.key} className="grid min-w-0 items-baseline" style={columnsStyle}>
          <dt className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap pr-2 text-2xs text-fg-subtle">
            {entry.label}
          </dt>
          <dd className="m-0 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap pl-2 text-sm text-fg">
            {entry.value || "—"}
          </dd>
        </div>
      ))}
      {onChange ? (
        <div
          className="absolute inset-y-0 flex -translate-x-1/2"
          style={{ left: `${labelPercent}%` }}
        >
          <ColumnResizer
            widths={formatWidths([labelPercent, 100 - labelPercent])}
            count={2}
            leftIndex={0}
            containerRef={listRef}
            label="Resize the label column"
            onResize={(widths) => onChange(setBlockField(block, "labelWidth", widths[0]))}
          />
        </div>
      ) : null}
    </dl>
  );
}

function TablePreview({
  block,
  rowData,
  onChange,
}: {
  block: TableBlock;
  rowData?: unknown;
  onChange?: (block: Block) => void;
}) {
  const tableRef = useRef<HTMLDivElement | null>(null);
  const columns = block.columns ?? [];
  const numberRows = block.numberRows === true;
  const rows = Array.isArray(rowData) ? rowData.filter(isRecord) : [];

  if (columns.length === 0) {
    return <EmptyPreview>No columns yet</EmptyPreview>;
  }

  const { tracks, data } = tableColumnTracks(
    columns.map((column) => column.width),
    numberRows,
  );
  const trackStrings = formatWidths(tracks);
  const trackOffset = numberRows ? 1 : 0;

  return (
    <div
      ref={tableRef}
      className="relative min-w-0 overflow-hidden rounded-md border border-solid border-border"
    >
      <table className="w-full table-fixed border-collapse text-2xs">
        <colgroup>
          {numberRows ? <col style={{ width: `${tracks[0]}%` }} /> : null}
          {data.map((width, index) => (
            <col key={columns[index].key} style={{ width: `${width}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {numberRows ? (
              <th className="border-0 border-b border-solid border-border bg-surface-muted px-2 py-[5px] text-left font-semibold text-fg-subtle">
                #
              </th>
            ) : null}
            {columns.map((column) => (
              <th
                key={column.key}
                className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap border-0 border-b border-solid border-border bg-surface-muted px-2 py-[5px] text-left font-semibold text-fg"
              >
                {column.label || column.key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row, rowIndex) => (
              <tr key={tableRowPreviewKey(row, columns)} className="last:[&>td]:border-b-0">
                {numberRows ? (
                  <td className="border-0 border-b border-solid border-border px-2 py-[5px] text-left text-fg-subtle">
                    {rowIndex + 1}
                  </td>
                ) : null}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap border-0 border-b border-solid border-border px-2 py-[5px] text-left text-fg-muted"
                  >
                    {stringifyPreviewValue(row[column.key]) || "—"}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length + trackOffset}
                className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap border-0 px-2 py-[5px] text-left text-fg-muted"
              >
                No runtime rows yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {onChange
        ? columns.slice(0, -1).map((column, index) => {
            const leftIndex = trackOffset + index;
            const boundaryPercent = tracks
              .slice(0, leftIndex + 1)
              .reduce((total, value) => total + value, 0);

            return (
              <div
                key={`${column.key}:resizer`}
                className="absolute inset-y-0 flex -translate-x-1/2"
                style={{ left: `${boundaryPercent}%` }}
              >
                <ColumnResizer
                  widths={trackStrings}
                  count={tracks.length}
                  leftIndex={leftIndex}
                  containerRef={tableRef}
                  label={`Resize column ${index + 1}`}
                  onResize={(next) =>
                    onChange(
                      setBlockField(
                        block,
                        "columns",
                        columns.map((current, columnIndex) => ({
                          ...current,
                          width: (numberRows ? next.slice(1) : next)[columnIndex],
                        })),
                      ),
                    )
                  }
                />
              </div>
            );
          })
        : null}
    </div>
  );
}

function SpacerPreview({ block }: { block: SpacerBlock }) {
  const height = block.height;

  return (
    <div className="grid h-9 place-items-center rounded-md border border-dashed border-border-strong text-2xs text-fg-subtle">
      {typeof height === "string" ? `${height} spacer` : "Spacer"}
    </div>
  );
}

function DividerPreview({ block }: { block: DividerBlock }) {
  const style = block.style ?? "solid";
  const styleClass =
    style === "dashed"
      ? "border-dashed"
      : style === "dotted"
        ? "border-dotted"
        : style === "double"
          ? "border-double border-t-[3px]"
          : style === "none"
            ? "border-t-transparent"
            : "border-solid";

  return <div className={`my-2 border-0 border-t border-border-strong ${styleClass}`} />;
}

function mergeRecordValues(
  values: KeyValueValues | undefined,
  rowData: unknown,
): Record<string, unknown> {
  return Object.assign({}, values, isRecord(rowData) ? rowData : undefined);
}

function tableRowPreviewKey(row: Record<string, unknown>, columns: TableBlock["columns"]): string {
  return columns?.map((column) => stringifyPreviewValue(row[column.key])).join("|") ?? "";
}

function stringifyPreviewValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function stripMarkup(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
}
