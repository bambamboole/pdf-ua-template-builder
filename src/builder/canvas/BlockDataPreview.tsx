import { useRef, type ReactNode } from "react";
import type {
  Block,
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
import { setBlockConfigField } from "../state/configUpdates";
import { ColumnResizer } from "./ColumnResizer";
import { formatWidths, labelWidthPercent } from "./columns";

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
    case "key-value":
      return <KeyValuePreview block={block} rowData={rowData} onChange={onChange} />;
    case "table":
      return <TablePreview block={block} rowData={rowData} />;
    case "spacer":
      return <SpacerPreview block={block} />;
    case "divider":
      return <DividerPreview block={block} />;
    default:
      return null;
  }
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
  const fields = block.config?.fields ?? [];
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

  const labelPercent = labelWidthPercent(block.config?.labelWidth);
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
            onResize={(widths) => onChange(setBlockConfigField(block, "labelWidth", widths[0]))}
          />
        </div>
      ) : null}
    </dl>
  );
}

function TablePreview({ block, rowData }: { block: TableBlock; rowData?: unknown }) {
  const columns = block.config?.columns ?? [];
  const rows = Array.isArray(rowData) ? rowData.filter(isRecord) : [];

  if (columns.length === 0) {
    return <EmptyPreview>No columns yet</EmptyPreview>;
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-md border border-solid border-border">
      <table className="w-full table-fixed border-collapse text-2xs">
        <thead>
          <tr>
            {columns.slice(0, 4).map((column) => (
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
            rows.map((row) => (
              <tr key={tableRowPreviewKey(row, columns)} className="last:[&>td]:border-b-0">
                {columns.slice(0, 4).map((column) => (
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
                colSpan={Math.min(columns.length, 4)}
                className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap border-0 px-2 py-[5px] text-left text-fg-muted"
              >
                No runtime rows yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SpacerPreview({ block }: { block: SpacerBlock }) {
  const height = block.config?.height;

  return (
    <div className="grid h-9 place-items-center rounded-md border border-dashed border-border-strong text-2xs text-fg-subtle">
      {typeof height === "number" ? `${height}mm spacer` : "Spacer"}
    </div>
  );
}

function DividerPreview({ block }: { block: DividerBlock }) {
  const style = block.config?.style ?? "solid";
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

function tableRowPreviewKey(
  row: Record<string, unknown>,
  columns: NonNullable<TableBlock["config"]>["columns"],
): string {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
