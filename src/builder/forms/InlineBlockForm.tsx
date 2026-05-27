import type { ChangeEvent, ReactNode } from "react";
import type { Block } from "../../types/generated/template";
import type { JsonObject } from "../../types/template";
import type { JsonSchemaObject } from "../schema/schemaAdapter";

export interface InlineBlockFormProps {
  block: Block;
  fieldSchema: JsonSchemaObject;
  configSchema?: JsonSchemaObject;
  onChange: (block: Block) => void;
}

export function InlineBlockForm({
  block,
  fieldSchema,
  configSchema,
  onChange,
}: InlineBlockFormProps) {
  const fieldProperties = getProperties(fieldSchema);
  const configProperties = configSchema ? getProperties(configSchema) : {};

  return (
    <div className="inline-block-form">
      {Object.entries(fieldProperties).map(([field, schema]) =>
        renderControl({
          key: field,
          name: field,
          label: getLabel(field, schema),
          schema,
          value: getBlockValue(block, field),
          preserveEmptyString: true,
          onChange: (value) => onChange(setBlockField(block, field, value)),
        }),
      )}

      {Object.entries(configProperties).map(([field, schema]) =>
        renderControl({
          key: `config.${field}`,
          name: `config.${field}`,
          label: getLabel(field, schema),
          schema,
          value: getConfigValue(block, field),
          preserveEmptyString: false,
          onChange: (value) => onChange(setConfigField(block, field, value)),
        }),
      )}
    </div>
  );
}

interface ControlOptions {
  key: string;
  name: string;
  label: string;
  schema: JsonSchemaObject;
  value: unknown;
  preserveEmptyString: boolean;
  onChange: (value: unknown) => void;
}

function renderControl({
  key,
  name,
  label,
  schema,
  value,
  preserveEmptyString,
  onChange,
}: ControlOptions): ReactNode {
  const enumValues = getEnumValues(schema);
  const normalizedValue = value ?? "";

  if (enumValues.length > 0) {
    return (
      <label key={key}>
        {label}
        <select
          name={name}
          value={String(normalizedValue)}
          onChange={(event) => onChange(emptyToUndefined(event.currentTarget.value))}
        >
          <option value="" />
          {enumValues.map((enumValue) => (
            <option key={String(enumValue)} value={String(enumValue)}>
              {String(enumValue)}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (isNumberSchema(schema)) {
    return (
      <label key={key}>
        {label}
        <input
          name={name}
          type="number"
          value={String(normalizedValue)}
          onChange={(event) => onChange(numberValue(event))}
        />
      </label>
    );
  }

  if (isStringSchema(schema)) {
    const stringValue = String(normalizedValue);

    return (
      <label key={key}>
        {label}
        <input
          name={name}
          type="text"
          value={stringValue}
          onChange={(event) =>
            onChange(stringValueFromInput(event.currentTarget.value, preserveEmptyString))
          }
        />
      </label>
    );
  }

  return null;
}

function setBlockField(block: Block, field: string, value: unknown): Block {
  return {
    ...block,
    [field]: value,
  } as Block;
}

function setConfigField(block: Block, field: string, value: unknown): Block {
  const nextConfig = {
    ...(block.config as JsonObject | undefined),
  };

  if (value === undefined || value === "") {
    delete nextConfig[field];
  } else {
    nextConfig[field] = value;
  }

  const nextBlock = {
    ...block,
    config: nextConfig,
  } as Block;

  if (Object.keys(nextConfig).length === 0) {
    delete (nextBlock as { config?: unknown }).config;
  }

  return nextBlock;
}

function getBlockValue(block: Block, field: string): unknown {
  return (block as unknown as JsonObject)[field];
}

function getConfigValue(block: Block, field: string): unknown {
  return (block.config as JsonObject | undefined)?.[field];
}

function getProperties(schema: JsonSchemaObject): Record<string, JsonSchemaObject> {
  const properties = schema.properties;

  if (!isJsonObject(properties)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(properties).filter((entry): entry is [string, JsonSchemaObject] =>
      isJsonObject(entry[1]),
    ),
  );
}

function getLabel(field: string, schema: JsonSchemaObject): string {
  return typeof schema.title === "string" ? schema.title : field;
}

function getEnumValues(schema: JsonSchemaObject): unknown[] {
  return Array.isArray(schema.enum) ? schema.enum.filter((value) => value !== null) : [];
}

function isNumberSchema(schema: JsonSchemaObject): boolean {
  return hasType(schema, "number") || hasType(schema, "integer");
}

function isStringSchema(schema: JsonSchemaObject): boolean {
  return hasType(schema, "string");
}

function hasType(schema: JsonSchemaObject, type: string): boolean {
  if (schema.type === type) {
    return true;
  }

  return Array.isArray(schema.type) && schema.type.includes(type);
}

function numberValue(event: ChangeEvent<HTMLInputElement>): number | undefined {
  const value = event.currentTarget.value;

  return value === "" ? undefined : event.currentTarget.valueAsNumber;
}

function emptyToUndefined(value: string): string | undefined {
  return value === "" ? undefined : value;
}

function stringValueFromInput(value: string, preserveEmptyString: boolean): string | undefined {
  return preserveEmptyString ? value : emptyToUndefined(value);
}

function isJsonObject(value: unknown): value is JsonSchemaObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
