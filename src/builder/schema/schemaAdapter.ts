import type { Block } from "../../types/generated/template";
import type {
  JsonSchemaObject,
  JsonSchemaValue,
  TemplateSchemaPropertyGroup,
  TemplateSchemaMetadata,
} from "../../types/template";
import { isRecord } from "../lib/records";

export type { JsonSchemaObject, JsonSchemaValue };

const PDF_UA_DEFAULT_KEY = "x-pdfUaDefault";
const PDF_UA_GROUP_KEY = "x-pdfUaGroup";

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

export function getSchemaDefault(fieldSchema: JsonSchemaObject): JsonSchemaValue | undefined {
  const value = fieldSchema[PDF_UA_DEFAULT_KEY] ?? fieldSchema.default;

  return isJsonSchemaValue(value) ? value : undefined;
}

export function getSchemaPropertyGroup(
  fieldSchema: JsonSchemaObject,
): TemplateSchemaPropertyGroup | undefined {
  const value = fieldSchema[PDF_UA_GROUP_KEY];

  return isTemplateSchemaPropertyGroup(value) ? value : undefined;
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
  const schemaDefault = getSchemaDefault(fieldSchema);

  if (schemaDefault !== undefined) {
    return schemaDefault;
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
  return isRecord(value);
}

function isJsonSchemaValue(value: unknown): value is JsonSchemaValue {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonSchemaValue);
  }

  return isRecord(value);
}

function isTemplateSchemaPropertyGroup(value: unknown): value is TemplateSchemaPropertyGroup {
  return value === "content" || value === "layout" || value === "style" || value === "data";
}

function decodeJsonPointerSegment(segment: string): string {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}
