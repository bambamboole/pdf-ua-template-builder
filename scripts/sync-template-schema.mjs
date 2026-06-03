import { writeFile } from "node:fs/promises";

const defaultBaseUrl = process.env.PDF_UA_API_URL ?? "http://localhost:9999";
const openApiUrl =
  process.env.PDF_UA_OPENAPI_URL ?? `${defaultBaseUrl.replace(/\/+$/, "")}/openapi.json`;
const outputUrl = new URL("../schemas/template.schema.json", import.meta.url);

const response = await fetch(openApiUrl, {
  headers: {
    Accept: "application/json",
  },
});

if (!response.ok) {
  throw new Error(
    `Failed to fetch OpenAPI document from ${openApiUrl}: ${response.status} ${response.statusText}`,
  );
}

const openApiDocument = await response.json();
const templateSchema = extractTemplateSchema(openApiDocument);

await writeFile(outputUrl, `${JSON.stringify(templateSchema, null, 2)}\n`);
console.log(`Synced Template schema from ${openApiUrl}`);

function extractTemplateSchema(openApi) {
  const schemas = openApi?.components?.schemas;
  const template = schemas?.Template;

  if (!isRecord(schemas) || !isRecord(template)) {
    throw new Error("OpenAPI document does not contain components.schemas.Template");
  }

  const templateDefs = isRecord(template.$defs)
    ? template.$defs
    : Object.fromEntries(Object.entries(schemas).filter(([name]) => name !== "Template"));

  return rewriteOpenApiRefs(
    repairKnownOpenApiOmissions({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      ...template,
      $defs: templateDefs,
    }),
  );
}

function repairKnownOpenApiOmissions(schema) {
  const defs = schema.$defs;
  const block = defs?.block;
  const barcodeBlock = defs?.barcodeBlock;

  if (!isRecord(defs) || !isRecord(block) || !isRecord(barcodeBlock)) {
    return schema;
  }

  const oneOf = Array.isArray(block.oneOf) ? block.oneOf : [];
  const hasBarcodeBlock = oneOf.some(
    (entry) => isRecord(entry) && entry.$ref === "#/components/schemas/barcodeBlock",
  );

  if (hasBarcodeBlock) {
    return schema;
  }

  const metadata = schema["x-pdfUa"];
  const blockOrder = Array.isArray(metadata?.blockOrder) ? metadata.blockOrder : undefined;

  return {
    ...schema,
    $defs: {
      ...defs,
      block: {
        ...block,
        oneOf: [...oneOf, { $ref: "#/components/schemas/barcodeBlock" }],
      },
    },
    ...(blockOrder
      ? {
          "x-pdfUa": {
            ...metadata,
            blockOrder: insertAfter(blockOrder, "image", "barcode"),
          },
        }
      : {}),
  };
}

function insertAfter(values, after, value) {
  if (values.includes(value)) {
    return values;
  }

  const index = values.indexOf(after);

  if (index === -1) {
    return [...values, value];
  }

  return [...values.slice(0, index + 1), value, ...values.slice(index + 1)];
}

function rewriteOpenApiRefs(value) {
  if (Array.isArray(value)) {
    return value.map(rewriteOpenApiRefs);
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      key,
      key === "$ref" && typeof nested === "string"
        ? nested.replace(/^#\/components\/schemas\//, "#/$defs/")
        : rewriteOpenApiRefs(nested),
    ]),
  );
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
