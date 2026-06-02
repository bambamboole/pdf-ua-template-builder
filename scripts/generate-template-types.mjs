import { readFile, writeFile } from "node:fs/promises";
import { compile } from "json-schema-to-typescript";

const schemaUrl = new URL("../schemas/template.schema.json", import.meta.url);
const outputUrl = new URL("../src/types/generated/template.d.ts", import.meta.url);
const schemasDirUrl = new URL("../schemas/", import.meta.url);

const schema = JSON.parse(await readFile(schemaUrl, "utf8"));
const schemaForTypes = stripPdfUaHints(schema);
const declarations = await compile(schemaForTypes, "Template", {
  cwd: schemasDirUrl.pathname,
  style: {
    bracketSpacing: true,
  },
  unreachableDefinitions: true,
});

await writeFile(outputUrl, declarations);

function stripPdfUaHints(value) {
  if (Array.isArray(value)) {
    return value.map(stripPdfUaHints);
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !key.startsWith("x-pdfUa"))
      .map(([key, nested]) => [key, stripPdfUaHints(nested)]),
  );
}

function isRecord(value) {
  return typeof value === "object" && value !== null;
}
