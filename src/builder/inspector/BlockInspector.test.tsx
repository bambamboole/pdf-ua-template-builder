import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { TemplateSchemaResponse } from "../../types/template";
import { createEditorModel, resolveSelectedEditorBlock } from "../state/editorModel";
import { BlockInspector } from "./BlockInspector";

const schema = {
  "x-pdfUa": {
    kind: "template",
    templateVersion: 1,
    renderEndpoint: "/render/template",
    templateFields: [],
    attachmentFields: [],
    externalFontFields: [],
    bundledFonts: [],
    blockOrder: ["heading", "text", "divider"],
    pageFormats: [],
  },
} satisfies TemplateSchemaResponse;

describe("BlockInspector", () => {
  it("renders the inspector shell for the selected block", () => {
    const model = createEditorModel({
      version: 1,
      rows: [{ blocks: [{ type: "heading", id: "heading-1", text: "Title" }] }],
    });
    const selectedBlockUid = model.rows[0]?.blocks[0]?.uid ?? "";
    const selectedBlock = resolveSelectedEditorBlock(model, selectedBlockUid);

    const html = renderToStaticMarkup(
      <BlockInspector
        block={selectedBlock}
        schema={schema}
        data={{}}
        onChangeBlock={() => undefined}
        onRemoveBlock={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(html).toContain('aria-label="Block inspector"');
    expect(html).toContain("Heading");
    expect(html).toContain("heading-1");
    expect(html).toContain(selectedBlockUid);
    expect(html).toContain("Content");
    expect(html).toContain("Layout");
    expect(html).toContain("Typography");
    expect(html).toContain("Spacing");
  });

  it("shows the empty state when no block is selected", () => {
    const model = createEditorModel({
      version: 1,
      rows: [{ blocks: [{ type: "text", id: "text-1", text: "Body" }] }],
    });

    const html = renderToStaticMarkup(
      <BlockInspector
        block={resolveSelectedEditorBlock(model, "removed-uid")}
        schema={schema}
        data={{}}
        onChangeBlock={() => undefined}
        onRemoveBlock={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(html).toContain("Select a block to inspect it.");
    expect(html).not.toContain("text-1");
  });
});
