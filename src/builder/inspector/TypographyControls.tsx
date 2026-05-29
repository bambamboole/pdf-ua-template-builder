import type { ReactNode } from "react";
import type { Block, Template, TypographyConfig } from "../../types/generated/template";
import type { TemplateSchemaMetadata } from "../../types/template";
import { ColorField, NumberField, SelectField } from "../forms/controls";
import { setBlockTypographyField, setTemplateTypographyField } from "../state/configUpdates";
import { ALIGN_OPTIONS } from "./alignOptions";

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
      <SelectField
        name={`${namePrefix}.family`}
        label="Family"
        value={typography?.family ?? undefined}
        options={fontOptions}
        optional
        emptyLabel="Default"
        onChange={(value) => handleChange("family", value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          name={`${namePrefix}.size`}
          label="Size"
          value={typography?.size ?? undefined}
          min={1}
          step={1}
          placeholder="12"
          onChange={(value) => handleChange("size", value)}
        />
        <NumberField
          name={`${namePrefix}.weight`}
          label="Weight"
          value={typography?.weight ?? undefined}
          min={1}
          step={1}
          placeholder="400"
          onChange={(value) => handleChange("weight", value)}
        />
        <SelectField
          name={`${namePrefix}.align`}
          label="Align"
          value={typography?.align ?? undefined}
          optional
          options={ALIGN_OPTIONS}
          onChange={(value) => handleChange("align", value)}
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
