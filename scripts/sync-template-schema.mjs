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

  return rewriteOpenApiRefs({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    ...template,
    $defs: templateDefs,
  });
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
