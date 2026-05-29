import type { ChangeEvent, ReactNode } from "react";
import type { Block, Template, TypographyConfig } from "../../types/generated/template";
import type { TemplateSchemaMetadata } from "../../types/template";
import {
  BuilderField,
  ColorField,
  createFieldId,
  FieldGroup,
  Input,
  NumberField,
  SelectField,
} from "../forms/controls";
import { setBlockTypographyField, setTemplateTypographyField } from "../state/configUpdates";

type TypographyAlign = Exclude<TypographyConfig["align"], null | undefined>;

interface TypographyControlsBaseProps {
  metadata?: Pick<TemplateSchemaMetadata, "bundledFonts">;
  title?: string;
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

const alignOptions = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
] as const satisfies ReadonlyArray<{ value: TypographyAlign; label: string }>;

export function TypographyControls(props: TypographyControlsProps): ReactNode {
  const typography =
    props.target === "block" ? props.block.config?.typography : props.template.config?.typography;
  const namePrefix = props.target === "block" ? "config.typography" : "template.config.typography";
  const fontOptions = bundledFontOptions(props.metadata);

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
    <FieldGroup legend={props.title ?? "Typography"}>
      <FontFamilyField
        name={`${namePrefix}.family`}
        value={typography?.family ?? undefined}
        fontOptions={fontOptions}
        onChange={(value) => handleChange("family", value)}
      />
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
        options={alignOptions}
        onChange={(value) => handleChange("align", value)}
      />
      <ColorField
        name={`${namePrefix}.color`}
        label="Color"
        value={typography?.color ?? undefined}
        onChange={(value) => handleChange("color", value)}
      />
    </FieldGroup>
  );
}

interface FontFamilyFieldProps {
  name: string;
  value?: string;
  fontOptions: string[];
  onChange: (value: string | undefined) => void;
}

function FontFamilyField({ name, value, fontOptions, onChange }: FontFamilyFieldProps): ReactNode {
  const id = createFieldId(name);
  const listId = fontOptions.length > 0 ? `${id}-options` : undefined;

  return (
    <BuilderField
      name={name}
      label="Family"
      id={id}
      help={
        fontOptions.length > 0 ? "Choose a bundled font or type another family name." : undefined
      }
    >
      <Input
        id={id}
        name={name}
        type="text"
        list={listId}
        value={value ?? ""}
        autoComplete="off"
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(optionalTextValue(event.currentTarget.value))
        }
      />
      {listId ? (
        <datalist id={listId}>
          {fontOptions.map((font) => (
            <option key={font} value={font} />
          ))}
        </datalist>
      ) : null}
    </BuilderField>
  );
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

function optionalTextValue(value: string): string | undefined {
  return value === "" ? undefined : value;
}
