import type { ReactNode } from "react";
import type { Block, BlockConfig, DividerStyle, TableStyle } from "../../types/generated/template";
import {
  NumberField,
  SelectField,
  TextField,
  UnitField,
  type SelectFieldOption,
} from "../forms/controls";
import { setTableNumberRows } from "../forms/TableBlockEditor";
import { setBlockConfigField } from "../state/configUpdates";
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
        <NumberField
          name="config.height"
          label="Height"
          value={block.config?.height}
          min={0}
          step={0.5}
          onChange={(value) => onChangeBlock(setBlockConfigField(block, "height", value))}
        />
      );
    case "image":
      return (
        <NumberField
          name="config.maxHeight"
          label="Max height"
          value={block.config?.maxHeight}
          min={0}
          step={0.5}
          onChange={(value) => onChangeBlock(setBlockConfigField(block, "maxHeight", value))}
        />
      );
    case "divider":
      return (
        <>
          <NumberField
            name="config.thickness"
            label="Thickness"
            value={block.config?.thickness}
            min={0}
            step={0.5}
            onChange={(value) => onChangeBlock(setBlockConfigField(block, "thickness", value))}
          />
          <TextField
            name="config.lineColor"
            label="Line color"
            value={block.config?.lineColor}
            placeholder="#334455"
            emptyValue="undefined"
            onChange={(value) => onChangeBlock(setBlockConfigField(block, "lineColor", value))}
          />
          <SelectField
            name="config.style"
            label="Line style"
            value={block.config?.style}
            options={dividerStyleOptions}
            optional
            emptyLabel="Default"
            onChange={(value) => onChangeBlock(setBlockConfigField(block, "style", value))}
          />
        </>
      );
    case "table":
      return (
        <div className="grid grid-cols-2 gap-2">
          <SelectField
            name="config.style"
            label="Table style"
            value={block.config?.style}
            options={tableStyleOptions}
            optional
            emptyLabel="Default"
            onChange={(value) => onChangeBlock(setBlockConfigField(block, "style", value))}
          />
          <SelectField
            name="config.numberRows"
            label="Row numbers"
            value={numberRowsValue(block.config?.numberRows)}
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
