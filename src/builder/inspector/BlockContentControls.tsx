import type { ReactNode } from "react";
import type { Block } from "../../types/generated/template";
import { ImageBlockEditor } from "../forms/ImageBlockEditor";
import { KeyValueBlockEditor } from "../forms/KeyValueBlockEditor";
import { TableBlockEditor } from "../forms/TableBlockEditor";
import { SelectField, TextAreaField, TextField, type SelectFieldOption } from "../forms/controls";
import { setBlockConfigField } from "../state/configUpdates";

export interface BlockContentControlsProps {
  block: Block;
  rowData?: unknown;
  onChangeBlock: (block: Block) => void;
  onChangeRowData?: (data: unknown) => void;
}

type HeadingLevelValue = "1" | "2" | "3" | "4" | "5" | "6";

const headingLevelOptions = [
  { value: "1", label: "Heading 1" },
  { value: "2", label: "Heading 2" },
  { value: "3", label: "Heading 3" },
  { value: "4", label: "Heading 4" },
  { value: "5", label: "Heading 5" },
  { value: "6", label: "Heading 6" },
] as const satisfies readonly SelectFieldOption<HeadingLevelValue>[];

export function BlockContentControls({
  block,
  rowData,
  onChangeBlock,
  onChangeRowData,
}: BlockContentControlsProps): ReactNode {
  switch (block.type) {
    case "text":
      return (
        <div className="grid gap-2">
          <TextAreaField
            name="text"
            label="Text"
            value={block.text}
            rows={4}
            onChange={(value) => onChangeBlock({ ...block, text: value ?? "" })}
          />
        </div>
      );
    case "html":
      return (
        <div className="grid gap-2">
          <TextAreaField
            name="html"
            label="HTML"
            value={block.html}
            rows={6}
            onChange={(value) => onChangeBlock({ ...block, html: value ?? "" })}
          />
        </div>
      );
    case "heading":
      return (
        <div className="grid gap-2">
          <TextField
            name="text"
            label="Text"
            value={block.text}
            onChange={(value) => onChangeBlock({ ...block, text: value ?? "" })}
          />
          <SelectField
            name="config.level"
            label="Level"
            value={headingLevelValue(block.config?.level)}
            options={headingLevelOptions}
            optional
            emptyLabel="Default"
            onChange={(value) =>
              onChangeBlock(setBlockConfigField(block, "level", parseHeadingLevel(value)))
            }
          />
        </div>
      );
    case "image":
      return <ImageBlockEditor block={block} onChangeBlock={onChangeBlock} />;
    case "key-value":
      return <KeyValueBlockEditor block={block} onChangeBlock={onChangeBlock} />;
    case "table":
      return (
        <TableBlockEditor
          block={block}
          rowData={rowData}
          onChangeBlock={onChangeBlock}
          onChangeRowData={onChangeRowData}
        />
      );
    case "spacer":
    case "divider":
      return <p className="m-0 text-xs text-fg-muted">No content fields for this block.</p>;
  }
}

function headingLevelValue(value: number | undefined): HeadingLevelValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  const stringValue = String(value);

  return isHeadingLevelValue(stringValue) ? stringValue : undefined;
}

function parseHeadingLevel(value: HeadingLevelValue | undefined): number | undefined {
  return value === undefined ? undefined : Number(value);
}

function isHeadingLevelValue(value: string): value is HeadingLevelValue {
  return headingLevelOptions.some((option) => option.value === value);
}
