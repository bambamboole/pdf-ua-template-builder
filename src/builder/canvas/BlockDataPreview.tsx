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

export interface BlockDataPreviewProps {
  block: Block;
  rowData?: unknown;
}

const emptyClass = "m-0 text-sm text-stone-400";
const copyClass =
  "m-0 line-clamp-3 overflow-hidden text-sm leading-[1.45] text-stone-500 [display:-webkit-box] [-webkit-box-orient:vertical]";
const headingCopyClass =
  "m-0 line-clamp-2 overflow-hidden text-[17px] font-semibold leading-[1.25] text-stone-900 [display:-webkit-box] [-webkit-box-orient:vertical]";

export function BlockDataPreview({ block, rowData }: BlockDataPreviewProps) {
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
      return <KeyValuePreview block={block} rowData={rowData} />;
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
    return <p className={emptyClass}>No text yet</p>;
  }

  return <p className={variant === "heading" ? headingCopyClass : copyClass}>{text}</p>;
}

function HtmlPreview({ block }: { block: HtmlBlock }) {
  const text = stripMarkup(block.html).trim();

  if (text.length === 0) {
    return <p className={emptyClass}>No HTML content yet</p>;
  }

  return <p className={copyClass}>{text}</p>;
}

function ImagePreview({ block }: { block: ImageBlock }) {
  const src = block.src.trim();

  if (src.length === 0) {
    return <p className={emptyClass}>No image selected</p>;
  }

  return (
    <div className="grid min-h-[72px] place-items-center overflow-hidden rounded-md border border-solid border-stone-200 bg-stone-100">
      <img
        className="block max-h-[120px] max-w-full object-contain"
        src={src}
        alt={block.alt ?? ""}
      />
    </div>
  );
}

function KeyValuePreview({ block, rowData }: { block: KeyValueBlock; rowData?: unknown }) {
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
    return <p className={emptyClass}>No fields yet</p>;
  }

  return (
    <dl className="m-0 grid gap-0.5">
      {entries.slice(0, 5).map((entry) => (
        <div
          key={entry.key}
          className="grid min-w-0 items-baseline gap-2 grid-cols-[minmax(72px,0.42fr)_minmax(0,1fr)]"
        >
          <dt className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-stone-400">
            {entry.label}
          </dt>
          <dd className="m-0 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-stone-900">
            {entry.value || "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function TablePreview({ block, rowData }: { block: TableBlock; rowData?: unknown }) {
  const columns = block.config?.columns ?? [];
  const rows = Array.isArray(rowData) ? rowData.filter(isRecord) : [];

  if (columns.length === 0) {
    return <p className={emptyClass}>No columns yet</p>;
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-md border border-solid border-stone-200">
      <table className="w-full table-fixed border-collapse text-[11px]">
        <thead>
          <tr>
            {columns.slice(0, 4).map((column) => (
              <th
                key={column.key}
                className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap border-0 border-b border-solid border-stone-200 bg-stone-100 px-2 py-[5px] text-left font-semibold text-stone-900"
              >
                {column.label || column.key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.slice(0, 3).map((row) => (
              <tr key={tableRowPreviewKey(row, columns)} className="last:[&>td]:border-b-0">
                {columns.slice(0, 4).map((column) => (
                  <td
                    key={column.key}
                    className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap border-0 border-b border-solid border-stone-200 px-2 py-[5px] text-left text-stone-500"
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
                className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap border-0 px-2 py-[5px] text-left text-stone-500"
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
    <div className="grid h-9 place-items-center rounded-md border border-dashed border-stone-300 text-[11px] text-stone-400">
      {typeof height === "number" ? `${height}mm spacer` : "Spacer"}
    </div>
  );
}

function DividerPreview({ block }: { block: DividerBlock }) {
  const style = block.config?.style ?? "solid";
  const baseClass = "my-2 border-0 border-t border-stone-300";
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

  return <div className={`${baseClass} ${styleClass}`} />;
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
