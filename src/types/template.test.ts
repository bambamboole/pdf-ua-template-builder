import { describe, expect, it } from "vitest";
import { getTemplateSchemaMetadata, type TemplateSchemaResponse } from "./template";

describe("template schema metadata", () => {
  it("reads backend metadata from the x-pdfUa extension", () => {
    const schema = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://pdf-ua-api.com/schemas/template-v1.json",
      title: "Template",
      type: "object",
      properties: {},
      "x-pdfUa": {
        kind: "template",
        templateVersion: 1,
        renderEndpoint: "/render/template",
        templateFields: ["version", "rows"],
        attachmentFields: ["name", "content"],
        externalFontFields: ["src"],
        bundledFonts: ["Inter", "Roboto"],
        blockOrder: ["text", "divider"],
        pageFormats: [{ name: "A4", widthMm: 210, heightMm: 297 }],
      },
    } satisfies TemplateSchemaResponse;

    expect(getTemplateSchemaMetadata(schema)).toEqual(schema["x-pdfUa"]);
  });
});
