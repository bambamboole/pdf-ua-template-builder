import { describe, expect, it } from "vitest";
import type { TemplateSchemaMetadata } from "../../types/template";
import {
  createDefaultBlock,
  getBlockConfigSchema,
  getBlockFieldSchema,
  getBlockTypes,
  getSchemaDefault,
  getSchemaMetadata,
  getSchemaPropertyGroup,
  type JsonSchemaObject,
} from "./schemaAdapter";

const metadata: TemplateSchemaMetadata = {
  kind: "template",
  templateVersion: 2,
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
  $id: "https://pdf-ua-api.com/schemas/template-v2.json",
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
        text: { type: "string", "x-pdfUaGroup": "content" },
        level: { type: "integer", "x-pdfUaDefault": 2, "x-pdfUaGroup": "content" },
        config: { $ref: "#/$defs/blockConfig" },
      },
    },
    textBlock: {
      type: "object",
      required: ["type", "text"],
      properties: {
        type: { const: "text" },
        id: { type: ["string", "null"] },
        text: { type: "string", "x-pdfUaDefault": "Body copy" },
        config: { $ref: "#/$defs/blockConfig" },
      },
    },
    dividerBlock: {
      type: "object",
      required: ["type"],
      properties: {
        type: { const: "divider" },
        id: { type: ["string", "null"] },
        style: { enum: ["solid", "dashed"], "x-pdfUaDefault": "solid" },
        config: { $ref: "#/$defs/blockConfig" },
      },
    },
    blockConfig: {
      type: "object",
      properties: {
        width: { type: "string", "x-pdfUaGroup": "layout" },
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
        text: { type: "string", "x-pdfUaGroup": "content" },
        level: { type: "integer", "x-pdfUaDefault": 2, "x-pdfUaGroup": "content" },
      },
      required: ["text"],
      $defs: schema.$defs,
    });
  });

  it("resolves the block config schema", () => {
    expect(getBlockConfigSchema(schema, "heading")).toEqual({
      ...(schema.$defs.blockConfig as JsonSchemaObject),
      $defs: schema.$defs,
    });
  });

  it("reads namespaced backend schema hints", () => {
    const headingLevel = (
      (schema.$defs.headingBlock as JsonSchemaObject).properties as Record<string, JsonSchemaObject>
    ).level;

    expect(getSchemaDefault(headingLevel)).toBe(2);
    expect(getSchemaPropertyGroup(headingLevel)).toBe("content");
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

  it("uses x-pdfUaDefault for required defaults", () => {
    expect(createDefaultBlock(schema, "text", "text-1")).toEqual({
      type: "text",
      id: "text-1",
      text: "Body copy",
    });
  });

  it("discovers barcode from block definitions and creates a renderable default", () => {
    const barcodeSchema = {
      ...schema,
      $defs: {
        ...schema.$defs,
        block: {
          oneOf: [
            ...((schema.$defs.block as JsonSchemaObject).oneOf as JsonSchemaObject[]),
            { $ref: "#/$defs/barcodeBlock" },
          ],
        },
        barcodeBlock: {
          type: "object",
          required: ["type", "symbology", "content"],
          properties: {
            type: { const: "barcode" },
            id: { type: ["string", "null"] },
            symbology: { enum: ["qr", "code128"] },
            content: {
              oneOf: [
                {
                  type: "object",
                  required: ["type", "value"],
                  properties: { type: { const: "raw" }, value: { type: "string" } },
                },
              ],
            },
          },
        },
      },
    } satisfies JsonSchemaObject;

    expect(getBlockTypes(barcodeSchema)).toEqual(["heading", "text", "divider", "barcode"]);
    expect(createDefaultBlock(barcodeSchema, "barcode", "barcode-1")).toEqual({
      type: "barcode",
      id: "barcode-1",
      symbology: "qr",
      content: { type: "raw", value: "Example" },
    });
  });
});
