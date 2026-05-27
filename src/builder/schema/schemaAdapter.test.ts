import { describe, expect, it } from "vitest";
import type { TemplateSchemaMetadata } from "../../types/template";
import {
  createDefaultBlock,
  createExampleTemplate,
  getBlockConfigSchema,
  getBlockFieldSchema,
  getBlockTypes,
  getSchemaMetadata,
  type JsonSchemaObject,
} from "./schemaAdapter";

const metadata: TemplateSchemaMetadata = {
  kind: "template",
  templateVersion: 1,
  renderEndpoint: "/render/template",
  templateFields: ["version", "rows"],
  attachmentFields: [],
  externalFontFields: [],
  bundledFonts: [],
  blockOrder: ["heading", "text", "divider", "image"],
  pageFormats: [{ name: "A4", widthMm: 210, heightMm: 297 }],
};

const schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://pdf-ua-api.com/schemas/template-v1.json",
  title: "Template",
  type: "object",
  $defs: {
    block: {
      oneOf: [
        { $ref: "#/$defs/dividerBlock" },
        { $ref: "#/$defs/headingBlock" },
        { $ref: "#/$defs/textBlock" },
      ],
    },
    headingBlock: {
      type: "object",
      required: ["type", "text"],
      properties: {
        type: { const: "heading" },
        id: { type: ["string", "null"] },
        text: { type: "string" },
        config: { $ref: "#/$defs/headingConfig" },
      },
    },
    textBlock: {
      type: "object",
      required: ["type", "text"],
      properties: {
        type: { const: "text" },
        id: { type: ["string", "null"] },
        text: { type: "string", default: "Body copy" },
      },
    },
    dividerBlock: {
      type: "object",
      required: ["type"],
      properties: {
        type: { const: "divider" },
        id: { type: ["string", "null"] },
        config: { $ref: "#/$defs/dividerConfig" },
      },
    },
    headingConfig: {
      type: "object",
      properties: {
        level: { type: "number", default: 2 },
      },
    },
    dividerConfig: {
      type: "object",
      properties: {
        style: { enum: ["solid", "dashed"] },
      },
    },
  },
  "x-pdfUa": metadata,
} satisfies JsonSchemaObject;

describe("schema adapter", () => {
  it("lists block types from block oneOf using metadata order", () => {
    expect(getBlockTypes(schema)).toEqual(["heading", "text", "divider"]);
  });

  it("returns schema metadata from the x-pdfUa extension", () => {
    expect(getSchemaMetadata(schema)).toBe(metadata);
  });

  it("throws a useful error when metadata block order is malformed", () => {
    const malformedSchema = {
      ...schema,
      "x-pdfUa": {
        ...metadata,
        blockOrder: "heading",
      },
    } satisfies JsonSchemaObject;

    expect(() => getBlockTypes(malformedSchema)).toThrow(/Invalid template schema metadata/);
  });

  it("returns block field schema without type or config", () => {
    expect(getBlockFieldSchema(schema, "heading")).toEqual({
      type: "object",
      properties: {
        id: { type: ["string", "null"] },
        text: { type: "string" },
      },
      required: ["text"],
      $defs: schema.$defs,
    });
  });

  it("resolves the block config schema", () => {
    expect(getBlockConfigSchema(schema, "heading")).toEqual(schema.$defs.headingConfig);
  });

  it("creates a conservative default heading block", () => {
    expect(createDefaultBlock(schema, "heading", "heading-1")).toEqual({
      type: "heading",
      id: "heading-1",
      text: "",
    });
  });

  it("creates a conservative default divider block", () => {
    expect(createDefaultBlock(schema, "divider", "divider-1")).toEqual({
      type: "divider",
      id: "divider-1",
    });
  });

  it("creates an example template from advertised heading, text, and divider blocks", () => {
    expect(createExampleTemplate(schema)).toEqual({
      version: 1,
      rows: [
        {
          blocks: [{ type: "heading", id: "heading-1", text: "Accessible PDF template" }],
        },
        { blocks: [{ type: "text", id: "text-1", text: "Edit this block inline." }] },
        { blocks: [{ type: "divider", id: "divider-1" }] },
      ],
    });
  });
});
