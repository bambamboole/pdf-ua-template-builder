import type { ReactNode } from "react";
import type { Block, FontWeight, Template, TypographyConfig } from "../../types/generated/template";
import type { TemplateSchemaMetadata } from "../../types/template";
import { ColorField, NumberField, SelectField, type SelectFieldOption } from "../controls";
import { setBlockTypographyField, setTemplateTypographyField } from "../state/configUpdates";
import { ALIGN_OPTIONS } from "./alignOptions";

// Backend FontWeight enum (1.x): weight is a string token, not a numeric value.
const WEIGHT_OPTIONS = [
  { value: "300", label: "300 · Light" },
  { value: "400", label: "400 · Regular" },
  { value: "500", label: "500 · Medium" },
  { value: "600", label: "600 · Semibold" },
  { value: "700", label: "700 · Bold" },
] as const satisfies readonly SelectFieldOption<FontWeight>[];

interface TypographyControlsBaseProps {
  metadata?: Pick<TemplateSchemaMetadata, "bundledFonts">;
}

export interface BlockTypographyControlsProps extends TypographyControlsBaseProps {
  target: "block";
  block: Block;
  onChangeBlock: (block: Block) => void;
}

export interface TemplateTypographyControlsProps extends TypographyControlsBaseProps {
  target: "template";
  template: Template;
  onChangeTemplate: (template: Template) => void;
}

export type TypographyControlsProps =
  | BlockTypographyControlsProps
  | TemplateTypographyControlsProps;

export function TypographyControls(props: TypographyControlsProps): ReactNode {
  const typography =
    props.target === "block" ? props.block.config?.typography : props.template.config?.typography;
  const namePrefix = props.target === "block" ? "config.typography" : "template.config.typography";
  const fontOptions = familyOptions(props.metadata, typography?.family ?? undefined);

  function handleChange<TKey extends keyof TypographyConfig>(
    field: TKey,
    value: TypographyConfig[TKey] | "" | null | undefined,
  ): void {
    if (props.target === "block") {
      props.onChangeBlock(setBlockTypographyField(props.block, field, value));
      return;
    }

    props.onChangeTemplate(setTemplateTypographyField(props.template, field, value));
  }

  return (
    <div className="grid min-w-0 gap-2">
      <div className="grid grid-cols-2 gap-2">
        <SelectField
          name={`${namePrefix}.family`}
          label="Family"
          value={typography?.family ?? undefined}
          options={fontOptions}
          optional
          emptyLabel="Default"
          onChange={(value) => handleChange("family", value)}
        />
        <SelectField
          name={`${namePrefix}.align`}
          label="Align"
          value={typography?.align ?? undefined}
          optional
          options={ALIGN_OPTIONS}
          onChange={(value) => handleChange("align", value)}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <NumberField
          name={`${namePrefix}.size`}
          label="Size"
          value={typography?.size ?? undefined}
          min={1}
          step={1}
          placeholder="12"
          onChange={(value) => handleChange("size", value)}
        />
        <SelectField
          name={`${namePrefix}.weight`}
          label="Weight"
          value={typography?.weight ?? undefined}
          options={WEIGHT_OPTIONS}
          optional
          emptyLabel="Default"
          onChange={(value) => handleChange("weight", value)}
        />
        <ColorField
          name={`${namePrefix}.color`}
          label="Color"
          value={typography?.color ?? undefined}
          onChange={(value) => handleChange("color", value)}
        />
      </div>
    </div>
  );
}

function familyOptions(
  metadata: Pick<TemplateSchemaMetadata, "bundledFonts"> | undefined,
  current: string | undefined,
): Array<{ value: string; label: string }> {
  const fonts = bundledFontOptions(metadata);

  if (current && !fonts.includes(current)) {
    fonts.push(current);
  }

  return fonts.map((font) => ({ value: font, label: font }));
}

function bundledFontOptions(
  metadata: Pick<TemplateSchemaMetadata, "bundledFonts"> | undefined,
): string[] {
  const seen = new Set<string>();
  const options: string[] = [];

  for (const font of metadata?.bundledFonts ?? []) {
    const normalized = font.trim();

    if (normalized === "" || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    options.push(normalized);
  }

  return options;
}
