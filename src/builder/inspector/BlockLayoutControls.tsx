import type { ReactNode } from "react";
import type { Block, BlockConfig, DividerStyle, TableStyle } from "../../types/generated/template";
import { SelectField, TextField, UnitField, type SelectFieldOption } from "../controls";
import { setTableNumberRows } from "./editors/TableBlockEditor";
import { setBlockConfigField, setBlockField } from "../state/configUpdates";
import { ALIGN_OPTIONS } from "./alignOptions";

export interface BlockLayoutControlsProps {
  block: Block;
  onChangeBlock: (block: Block) => void;
}

const dividerStyleOptions = [
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
  { value: "double", label: "Double" },
  { value: "none", label: "None" },
] as const satisfies readonly SelectFieldOption<DividerStyle>[];

const tableStyleOptions = [
  { value: "striped", label: "Striped" },
  { value: "bordered", label: "Bordered" },
  { value: "minimal", label: "Minimal" },
] as const satisfies readonly SelectFieldOption<TableStyle>[];

const numberRowsOptions = [
  { value: "show", label: "Show" },
  { value: "hide", label: "Hide" },
] as const satisfies readonly SelectFieldOption<NumberRowsValue>[];

type NumberRowsValue = "show" | "hide";

export function BlockLayoutControls({ block, onChangeBlock }: BlockLayoutControlsProps): ReactNode {
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 items-start gap-2">
        <UnitField
          name="config.width"
          label="Width"
          value={block.config?.width ?? undefined}
          placeholder="Full width"
          readOnly
          help="Drag the column divider on the canvas to resize."
        />
        <SelectField
          name="config.align"
          label="Align"
          value={block.config?.align ?? undefined}
          options={ALIGN_OPTIONS}
          optional
          emptyLabel="Default"
          onChange={(value) => onChangeBlock(setCommonConfigField(block, "align", value))}
        />
      </div>
      {renderTypeSpecificControls(block, onChangeBlock)}
    </div>
  );
}

function renderTypeSpecificControls(
  block: Block,
  onChangeBlock: (block: Block) => void,
): ReactNode {
  switch (block.type) {
    case "spacer":
      return (
        <UnitField
          name="height"
          label="Height"
          value={block.height}
          placeholder="5mm"
          onChange={(value) => onChangeBlock(setBlockField(block, "height", value))}
        />
      );
    case "image":
      return (
        <UnitField
          name="maxHeight"
          label="Max height"
          value={block.maxHeight}
          placeholder="60px"
          onChange={(value) => onChangeBlock(setBlockField(block, "maxHeight", value))}
        />
      );
    case "divider":
      return (
        <>
          <UnitField
            name="thickness"
            label="Thickness"
            value={block.thickness}
            placeholder="1pt"
            onChange={(value) => onChangeBlock(setBlockField(block, "thickness", value))}
          />
          <TextField
            name="lineColor"
            label="Line color"
            value={block.lineColor}
            placeholder="#334455"
            emptyValue="undefined"
            onChange={(value) => onChangeBlock(setBlockField(block, "lineColor", value))}
          />
          <SelectField
            name="style"
            label="Line style"
            value={block.style}
            options={dividerStyleOptions}
            optional
            emptyLabel="Default"
            onChange={(value) => onChangeBlock(setBlockField(block, "style", value))}
          />
        </>
      );
    case "table":
      return (
        <div className="grid grid-cols-2 gap-2">
          <SelectField
            name="style"
            label="Table style"
            value={block.style}
            options={tableStyleOptions}
            optional
            emptyLabel="Default"
            onChange={(value) => onChangeBlock(setBlockField(block, "style", value))}
          />
          <SelectField
            name="numberRows"
            label="Row numbers"
            value={numberRowsValue(block.numberRows)}
            options={numberRowsOptions}
            optional
            emptyLabel="Default"
            onChange={(value) =>
              onChangeBlock(setTableNumberRows(block, booleanFromNumberRows(value)))
            }
          />
        </div>
      );
    case "key-value":
    case "heading":
    case "text":
    case "html":
      return null;
  }
}

function setCommonConfigField<TKey extends "width" | "align">(
  block: Block,
  field: TKey,
  value: BlockConfig[TKey] | undefined,
): Block {
  switch (block.type) {
    case "text":
    case "html":
    case "heading":
    case "image":
    case "key-value":
    case "spacer":
    case "divider":
    case "table":
      return setBlockConfigField(block, field, value);
  }
}

function numberRowsValue(value: boolean | undefined): NumberRowsValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value ? "show" : "hide";
}

function booleanFromNumberRows(value: NumberRowsValue | undefined): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value === "show";
}
