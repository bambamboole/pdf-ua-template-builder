import { render, screen } from "@testing-library/react";
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

    render(
      <BlockInspector
        block={selectedBlock}
        schema={schema}
        data={{}}
        onChangeBlock={() => undefined}
        onRemoveBlock={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByRole("complementary", { name: "Block inspector" })).toBeInTheDocument();
    expect(screen.getByText("Heading")).toBeInTheDocument();
    expect(screen.getByText("heading-1")).toBeInTheDocument();
    expect(screen.getByText(selectedBlockUid)).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByText("Layout")).toBeInTheDocument();
    expect(screen.getByText("Typography")).toBeInTheDocument();
    expect(screen.getByText("Spacing")).toBeInTheDocument();
  });

  it("shows the empty state when no block is selected", () => {
    const model = createEditorModel({
      version: 1,
      rows: [{ blocks: [{ type: "text", id: "text-1", text: "Body" }] }],
    });

    render(
      <BlockInspector
        block={resolveSelectedEditorBlock(model, "removed-uid")}
        schema={schema}
        data={{}}
        onChangeBlock={() => undefined}
        onRemoveBlock={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByText("Select a block to inspect it.")).toBeInTheDocument();
    expect(screen.queryByText("text-1")).not.toBeInTheDocument();
  });
});
