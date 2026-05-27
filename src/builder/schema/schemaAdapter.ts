import type { Block, Template } from "../../types/generated/template";
import type { TemplateSchemaMetadata } from "../../types/template";

export type JsonSchemaValue =
  | string
  | number
  | boolean
  | null
  | JsonSchemaObject
  | JsonSchemaValue[];

export interface JsonSchemaObject {
  [key: string]: unknown;
}

export function getSchemaMetadata(schema: JsonSchemaObject): TemplateSchemaMetadata {
  return assertTemplateSchemaMetadata(schema["x-pdfUa"]);
}

export function resolveRef(schema: JsonSchemaObject, ref: string): JsonSchemaObject {
  if (!ref.startsWith("#/")) {
    throw new Error(`Unsupported schema ref: ${ref}`);
  }

  const value = ref
    .slice(2)
    .split("/")
    .reduce<unknown>((current, segment) => {
      if (!isSchemaObject(current)) {
        return undefined;
      }

      return current[decodeJsonPointerSegment(segment)];
    }, schema);

  if (!isSchemaObject(value)) {
    throw new Error(`Schema ref not found: ${ref}`);
  }

  return value;
}

export function getBlockTypes(schema: JsonSchemaObject): string[] {
  const discovered = getBlockDefinitions(schema)
    .map((definition) => getBlockType(definition))
    .filter((type): type is string => type !== undefined);

  const discoveredSet = new Set(discovered);
  const orderedTypes = getSchemaMetadata(schema).blockOrder.filter((type) =>
    discoveredSet.has(type),
  );
  const remainingTypes = discovered.filter((type) => !orderedTypes.includes(type));

  return [...orderedTypes, ...remainingTypes];
}

export function getBlockDefinition(
  schema: JsonSchemaObject,
  blockType: string,
): JsonSchemaObject | undefined {
  return getBlockDefinitions(schema).find((definition) => getBlockType(definition) === blockType);
}

export function getBlockFieldSchema(schema: JsonSchemaObject, blockType: string): JsonSchemaObject {
  const definition = requireBlockDefinition(schema, blockType);
  const properties = getProperties(definition);
  const fieldProperties = Object.fromEntries(
    Object.entries(properties).filter(([field]) => field !== "type" && field !== "config"),
  );
  const required = getStringArray(definition.required).filter((field) => field !== "type");

  return {
    type: "object",
    properties: fieldProperties,
    required,
    $defs: schema.$defs,
  };
}

export function getBlockConfigSchema(
  schema: JsonSchemaObject,
  blockType: string,
): JsonSchemaObject | undefined {
  const definition = requireBlockDefinition(schema, blockType);
  const config = getProperties(definition).config;

  if (!isSchemaObject(config)) {
    return undefined;
  }

  const ref = config.$ref;

  const configSchema = typeof ref === "string" ? resolveRef(schema, ref) : config;

  return {
    ...configSchema,
    $defs: schema.$defs,
  };
}

export function createDefaultBlock(schema: JsonSchemaObject, blockType: string, id: string): Block {
  const definition = requireBlockDefinition(schema, blockType);
  const properties = getProperties(definition);
  const block: Record<string, unknown> = {
    type: blockType,
    id,
  };

  for (const field of getStringArray(definition.required)) {
    if (field === "type" || field === "config" || field === "id" || block[field] !== undefined) {
      continue;
    }

    const fieldSchema = properties[field];

    if (isSchemaObject(fieldSchema)) {
      block[field] = createDefaultValue(schema, fieldSchema);
    }
  }

  return block as unknown as Block;
}

export function createExampleTemplate(schema: JsonSchemaObject): Template {
  const blockTypes = new Set(getBlockTypes(schema));
  const preferredTypes = ["heading", "text", "divider"].filter((type) => blockTypes.has(type));

  return {
    version: 1,
    rows: preferredTypes.map((type) => ({
      blocks: [createExampleBlock(schema, type)],
    })),
  };
}

function createExampleBlock(schema: JsonSchemaObject, blockType: string): Block {
  const block = createDefaultBlock(schema, blockType, `${blockType}-1`);

  if (block.type === "heading") {
    return { ...block, text: "Accessible PDF template" };
  }

  if (block.type === "text") {
    return { ...block, text: "Edit this block inline." };
  }

  return block;
}

function getBlockDefinitions(schema: JsonSchemaObject): JsonSchemaObject[] {
  const defs = schema.$defs;
  const block = isSchemaObject(defs) ? defs.block : undefined;
  const oneOf = isSchemaObject(block) && Array.isArray(block.oneOf) ? block.oneOf : [];

  return oneOf
    .map((entry) => {
      if (!isSchemaObject(entry)) {
        return undefined;
      }

      const ref = entry.$ref;

      return typeof ref === "string" ? resolveRef(schema, ref) : entry;
    })
    .filter((entry): entry is JsonSchemaObject => entry !== undefined);
}

function requireBlockDefinition(schema: JsonSchemaObject, blockType: string): JsonSchemaObject {
  const definition = getBlockDefinition(schema, blockType);

  if (!definition) {
    throw new Error(`Unknown block type: ${blockType}`);
  }

  return definition;
}

function getBlockType(definition: JsonSchemaObject): string | undefined {
  const typeProperty = getProperties(definition).type;

  if (!isSchemaObject(typeProperty)) {
    return undefined;
  }

  return typeof typeProperty.const === "string" ? typeProperty.const : undefined;
}

function getProperties(definition: JsonSchemaObject): Record<string, unknown> {
  return isSchemaObject(definition.properties) ? definition.properties : {};
}

function createDefaultValue(schema: JsonSchemaObject, fieldSchema: JsonSchemaObject): unknown {
  if ("default" in fieldSchema) {
    return fieldSchema.default;
  }

  if (Array.isArray(fieldSchema.enum)) {
    return fieldSchema.enum.find((value) => value !== null);
  }

  if (typeof fieldSchema.const === "string" || typeof fieldSchema.const === "number") {
    return fieldSchema.const;
  }

  if (typeof fieldSchema.$ref === "string") {
    return createDefaultValue(schema, resolveRef(schema, fieldSchema.$ref));
  }

  if (Array.isArray(fieldSchema.oneOf)) {
    const firstNonNullSchema = fieldSchema.oneOf.find(
      (option) => isSchemaObject(option) && option.type !== "null",
    );

    return isSchemaObject(firstNonNullSchema)
      ? createDefaultValue(schema, firstNonNullSchema)
      : undefined;
  }

  const type = getPrimaryType(fieldSchema.type);

  switch (type) {
    case "string":
      return "";
    case "integer":
    case "number":
      return 0;
    case "boolean":
      return false;
    case "array":
      return [];
    case "object":
      return {};
    default:
      return undefined;
  }
}

function getPrimaryType(type: unknown): string | undefined {
  if (typeof type === "string") {
    return type;
  }

  if (!Array.isArray(type)) {
    return undefined;
  }

  return type.find((entry): entry is string => typeof entry === "string" && entry !== "null");
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function assertTemplateSchemaMetadata(value: unknown): TemplateSchemaMetadata {
  if (!isSchemaObject(value) || !isStringArray(value.blockOrder)) {
    throw new Error("Invalid template schema metadata");
  }

  return value as unknown as TemplateSchemaMetadata;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isSchemaObject(value: unknown): value is JsonSchemaObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodeJsonPointerSegment(segment: string): string {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}
