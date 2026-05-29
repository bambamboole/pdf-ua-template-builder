import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import type { Block } from "../../types/generated/template";
import type { JsonObject } from "../../types/template";
import type { JsonSchemaObject } from "../schema/schemaAdapter";
import {
  arrayAddClass,
  arrayFieldClass,
  arrayLegendClass,
  checkboxLabelClass,
  controlClass,
  fieldLabelClass,
} from "./controls/fieldStyles";

export interface InlineBlockFormProps {
  block: Block;
  fieldSchema: JsonSchemaObject;
  configSchema?: JsonSchemaObject;
  onChange: (block: Block) => void;
}

const textareaControlClass = `${controlClass} min-h-24 font-mono text-xs`;

const arrayItemClass =
  "relative grid gap-2 rounded-md border border-solid border-stone-200 bg-stone-100 p-3";

export function InlineBlockForm({
  block,
  fieldSchema,
  configSchema,
  onChange,
}: InlineBlockFormProps) {
  const fieldProperties = getProperties(fieldSchema);
  const configProperties = configSchema ? getProperties(configSchema) : {};

  return (
    <div className="grid gap-3 [container-type:inline-size]">
      {Object.entries(fieldProperties).map(([field, schema]) =>
        renderControl({
          key: field,
          name: field,
          label: getLabel(field, schema),
          schema: withRootDefinitions(schema, fieldSchema),
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
          schema: configSchema ? withRootDefinitions(schema, configSchema) : schema,
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
  const resolvedSchema = resolveSchema(schema);
  const enumValues = getEnumValues(schema);
  const normalizedValue = value ?? "";

  if (enumValues.length > 0) {
    return (
      <label key={key} className={fieldLabelClass}>
        {label}
        <select
          className={controlClass}
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

  if (isArraySchema(resolvedSchema)) {
    return (
      <fieldset key={key} className={arrayFieldClass}>
        <legend className={arrayLegendClass}>{label}</legend>
        {renderArrayItems(name, resolvedSchema, value, onChange)}
        <button
          type="button"
          className={arrayAddClass}
          onClick={() => onChange([...arrayValue(value), createDefaultArrayItem(resolvedSchema)])}
        >
          Add {label}
        </button>
      </fieldset>
    );
  }

  if (isObjectSchema(resolvedSchema)) {
    return (
      <label key={key} className={fieldLabelClass}>
        {label}
        <JsonTextarea name={name} value={normalizedValue} onChange={onChange} />
      </label>
    );
  }

  if (isBooleanSchema(resolvedSchema)) {
    return (
      <label key={key} className={checkboxLabelClass}>
        <input
          className="h-3.5 w-3.5 accent-indigo-600"
          name={name}
          type="checkbox"
          checked={value === true}
          onChange={(event) => onChange(event.currentTarget.checked)}
        />
        {label}
      </label>
    );
  }

  if (isNumberSchema(resolvedSchema)) {
    return (
      <label key={key} className={fieldLabelClass}>
        {label}
        <input
          className={controlClass}
          name={name}
          type="number"
          value={String(normalizedValue)}
          onChange={(event) => onChange(numberValue(event))}
        />
      </label>
    );
  }

  if (isStringSchema(resolvedSchema)) {
    const stringValue = String(normalizedValue);

    return (
      <label key={key} className={fieldLabelClass}>
        {label}
        <input
          className={controlClass}
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

function renderArrayItems(
  name: string,
  schema: JsonSchemaObject,
  value: unknown,
  onChange: (value: unknown) => void,
): ReactNode {
  const items = arrayValue(value);
  const itemSchema = getArrayItemSchema(schema);
  const itemProperties = itemSchema ? getProperties(itemSchema) : {};

  if (Object.keys(itemProperties).length === 0) {
    return <JsonTextarea name={name} value={items} onChange={onChange} />;
  }

  return items.map((item, index) => {
    const itemRecord = isJsonObject(item) ? item : {};

    return (
      <div key={getArrayItemKey(name, index)} className={arrayItemClass}>
        {Object.entries(itemProperties).map(([field, fieldSchema]) =>
          renderControl({
            key: `${name}.${index}.${field}`,
            name: `${name}.${index}.${field}`,
            label: getLabel(field, fieldSchema),
            schema: withRootDefinitions(fieldSchema, schema),
            value: itemRecord[field],
            preserveEmptyString: true,
            onChange: (nextValue) =>
              onChange(replaceArrayItem(items, index, { ...itemRecord, [field]: nextValue })),
          }),
        )}
        <button
          type="button"
          className="w-fit cursor-pointer rounded border-0 bg-transparent px-1 text-[11px] text-stone-500 hover:text-red-700"
          onClick={() => onChange(removeArrayItem(items, index))}
        >
          Remove
        </button>
      </div>
    );
  });
}

function getArrayItemKey(name: string, position: number): string {
  return `${name}.position-${position}`;
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
  const resolvedSchema = resolveSchema(schema);

  return Array.isArray(resolvedSchema.enum)
    ? resolvedSchema.enum.filter((value) => value !== null)
    : [];
}

function isNumberSchema(schema: JsonSchemaObject): boolean {
  return hasType(schema, "number") || hasType(schema, "integer");
}

function isStringSchema(schema: JsonSchemaObject): boolean {
  return hasType(schema, "string");
}

function isBooleanSchema(schema: JsonSchemaObject): boolean {
  return hasType(schema, "boolean");
}

function isArraySchema(schema: JsonSchemaObject): boolean {
  return hasType(schema, "array");
}

function isObjectSchema(schema: JsonSchemaObject): boolean {
  return hasType(schema, "object") || isJsonObject(schema.additionalProperties);
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

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function replaceArrayItem(items: unknown[], index: number, item: unknown): unknown[] {
  return items.map((current, currentIndex) => (currentIndex === index ? item : current));
}

function removeArrayItem(items: unknown[], index: number): unknown[] {
  return items.filter((_, currentIndex) => currentIndex !== index);
}

function createDefaultArrayItem(schema: JsonSchemaObject): unknown {
  const itemSchema = getArrayItemSchema(schema);
  const properties = itemSchema ? getProperties(itemSchema) : {};

  if (Object.keys(properties).length === 0) {
    return "";
  }

  return Object.fromEntries(
    Object.entries(properties).map(([field, fieldSchema]) => [
      field,
      createDefaultValue(fieldSchema),
    ]),
  );
}

function createDefaultValue(schema: JsonSchemaObject): unknown {
  const resolvedSchema = resolveSchema(schema);

  if ("default" in resolvedSchema) {
    return resolvedSchema.default;
  }

  const enumValues = getEnumValues(resolvedSchema);

  if (enumValues.length > 0) {
    return enumValues[0];
  }

  if (isNumberSchema(resolvedSchema)) {
    return 0;
  }

  if (isBooleanSchema(resolvedSchema)) {
    return false;
  }

  if (isArraySchema(resolvedSchema)) {
    return [];
  }

  if (isObjectSchema(resolvedSchema)) {
    return {};
  }

  return "";
}

function getArrayItemSchema(schema: JsonSchemaObject): JsonSchemaObject | undefined {
  return isJsonObject(schema.items)
    ? resolveSchema(withRootDefinitions(schema.items, schema))
    : undefined;
}

function resolveSchema(schema: JsonSchemaObject): JsonSchemaObject {
  if (typeof schema.$ref !== "string") {
    return schema;
  }

  const defs = schema.$defs;

  if (!isJsonObject(defs) || !schema.$ref.startsWith("#/$defs/")) {
    return schema;
  }

  const definition = defs[schema.$ref.slice("#/$defs/".length)];

  return isJsonObject(definition) ? withRootDefinitions(definition, schema) : schema;
}

function withRootDefinitions(schema: JsonSchemaObject, parent: JsonSchemaObject): JsonSchemaObject {
  return "$defs" in schema || !("$defs" in parent) ? schema : { ...schema, $defs: parent.$defs };
}

function jsonText(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function parseJsonDraft(value: string): { ok: true; value: unknown } | { ok: false } {
  if (value.trim() === "") {
    return {
      ok: true,
      value: undefined,
    };
  }

  try {
    return {
      ok: true,
      value: JSON.parse(value),
    };
  } catch {
    return {
      ok: false,
    };
  }
}

function JsonTextarea({
  name,
  value,
  onChange,
}: {
  name: string;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const [draft, setDraft] = useState(() => jsonText(value));

  useEffect(() => {
    setDraft(jsonText(value));
  }, [value]);

  return (
    <textarea
      className={textareaControlClass}
      name={name}
      value={draft}
      onChange={(event) => {
        const nextDraft = event.currentTarget.value;
        const parsed = parseJsonDraft(nextDraft);

        setDraft(nextDraft);

        if (parsed.ok) {
          onChange(parsed.value);
        }
      }}
    />
  );
}

function isJsonObject(value: unknown): value is JsonSchemaObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
