import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { TemplateSchemaResponse } from "../types/template";
import { BlockInspector } from "./inspector/BlockInspector";
import { createEditorModel } from "./state/editorModel";
import {
  createNextBlockId,
  getRowIndex,
  reconcileSelectedBlockUid,
  resolveSelectedEditorBlock,
} from "./TemplateBuilder";
import { PdfPane } from "./pdf/PdfPane";

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

describe("PdfPane", () => {
  it("server-renders PDF objects without iframe sandboxing", () => {
    const html = renderToStaticMarkup(
      <PdfPane pdfUrl="blob:http://localhost:5174/test" error={null} loading={false} />,
    );

    expect(html).toContain('data="blob:http://localhost:5174/test"');
    expect(html).not.toContain("sandbox=");
  });
});

describe("getRowIndex", () => {
  it("resolves row drops over nested blocks to the block row", () => {
    const model = createEditorModel({
      version: 1,
      rows: [
        { blocks: [{ type: "heading", id: "heading-1", text: "Title" }] },
        { blocks: [{ type: "text", id: "text-1", text: "Body" }] },
      ],
    });

    expect(
      getRowIndex(model, model.rows[1].blocks[0].uid, {
        type: "block",
        rowUid: model.rows[1].uid,
        blockUid: model.rows[1].blocks[0].uid,
      }),
    ).toBe(1);
  });
});

describe("createNextBlockId", () => {
  it("creates ids from the current serialized model", () => {
    const model = createEditorModel({
      version: 1,
      rows: [
        {
          blocks: [
            { type: "heading", id: "heading-1", text: "Title" },
            { type: "text", id: "text-1", text: "Body" },
          ],
        },
      ],
    });

    expect(createNextBlockId(model, "heading")).toBe("heading-2");
    expect(createNextBlockId(model, "divider")).toBe("divider-1");
  });
});

describe("selected block inspector", () => {
  it("resolves a selected canvas block and renders the inspector shell", () => {
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

  it("clears the selected block uid after that block is removed", () => {
    const model = createEditorModel({
      version: 1,
      rows: [
        {
          blocks: [
            { type: "heading", id: "heading-1", text: "Title" },
            { type: "text", id: "text-1", text: "Body" },
          ],
        },
      ],
    });
    const removedBlockUid = model.rows[0]?.blocks[0]?.uid ?? "";
    const nextModel = createEditorModel({
      version: 1,
      rows: [{ blocks: [{ type: "text", id: "text-1", text: "Body" }] }],
    });

    expect(reconcileSelectedBlockUid(model, removedBlockUid)).toBe(removedBlockUid);
    expect(reconcileSelectedBlockUid(nextModel, removedBlockUid)).toBeNull();

    const html = renderToStaticMarkup(
      <BlockInspector
        block={resolveSelectedEditorBlock(nextModel, removedBlockUid)}
        schema={schema}
        data={{}}
        onChangeBlock={() => undefined}
        onRemoveBlock={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(html).toContain("Select a block to inspect it.");
    expect(html).not.toContain("heading-1");
  });
});
