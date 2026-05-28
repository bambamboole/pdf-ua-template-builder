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
    return <p className="builder-card-preview__empty">No text yet</p>;
  }

  return (
    <p className={`builder-card-preview__copy builder-card-preview__copy--${variant}`}>
      {text}
    </p>
  );
}

function HtmlPreview({ block }: { block: HtmlBlock }) {
  const text = stripMarkup(block.html).trim();

  if (text.length === 0) {
    return <p className="builder-card-preview__empty">No HTML content yet</p>;
  }

  return <p className="builder-card-preview__copy">{text}</p>;
}

function ImagePreview({ block }: { block: ImageBlock }) {
  const src = block.src.trim();

  if (src.length === 0) {
    return <p className="builder-card-preview__empty">No image selected</p>;
  }

  return (
    <div className="builder-card-preview__image-frame">
      <img className="builder-card-preview__image" src={src} alt={block.alt ?? ""} />
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
    return <p className="builder-card-preview__empty">No fields yet</p>;
  }

  return (
    <dl className="builder-card-preview__kv">
      {entries.slice(0, 5).map((entry) => (
        <div key={entry.key}>
          <dt>{entry.label}</dt>
          <dd>{entry.value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function TablePreview({ block, rowData }: { block: TableBlock; rowData?: unknown }) {
  const columns = block.config?.columns ?? [];
  const rows = Array.isArray(rowData) ? rowData.filter(isRecord) : [];

  if (columns.length === 0) {
    return <p className="builder-card-preview__empty">No columns yet</p>;
  }

  return (
    <div className="builder-card-preview__table-wrap">
      <table className="builder-card-preview__table">
        <thead>
          <tr>
            {columns.slice(0, 4).map((column) => (
              <th key={column.key}>{column.label || column.key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.slice(0, 3).map((row) => (
              <tr key={tableRowPreviewKey(row, columns)}>
                {columns.slice(0, 4).map((column) => (
                  <td key={column.key}>{stringifyPreviewValue(row[column.key]) || "—"}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={Math.min(columns.length, 4)}>No runtime rows yet</td>
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
    <div className="builder-card-preview__spacer">
      {typeof height === "number" ? `${height}mm spacer` : "Spacer"}
    </div>
  );
}

function DividerPreview({ block }: { block: DividerBlock }) {
  const style = block.config?.style ?? "solid";

  return <div className={`builder-card-preview__divider builder-card-preview__divider--${style}`} />;
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
