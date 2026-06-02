import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TemplateSchemaResponse } from "../../types/template";
import { createEditorModel, resolveSelectedEditorBlock } from "../state/editorModel";
import { BlockInspector } from "./BlockInspector";

const schema = {
  "x-pdfUa": {
    kind: "template",
    templateVersion: 2,
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
      version: 2,
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
    expect(screen.getByLabelText("ID")).toHaveValue("heading-1");
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByText("Layout")).toBeInTheDocument();
    expect(screen.getByText("Typography")).toBeInTheDocument();
    expect(screen.getByText("Spacing")).toBeInTheDocument();
  });

  it("edits the block id", () => {
    const model = createEditorModel({
      version: 2,
      rows: [{ blocks: [{ type: "heading", id: "heading-1", text: "Title" }] }],
    });
    const selectedBlockUid = model.rows[0]?.blocks[0]?.uid ?? "";
    const selectedBlock = resolveSelectedEditorBlock(model, selectedBlockUid);
    const onChangeBlock = vi.fn();

    render(
      <BlockInspector
        block={selectedBlock}
        schema={schema}
        data={{}}
        onChangeBlock={onChangeBlock}
        onRemoveBlock={() => undefined}
        onClose={() => undefined}
      />,
    );

    fireEvent.change(screen.getByLabelText("ID"), { target: { value: "summary" } });

    expect(onChangeBlock).toHaveBeenLastCalledWith(
      selectedBlockUid,
      expect.objectContaining({ type: "heading", id: "summary" }),
    );
  });

  it("moves focus into the panel when a block is selected", () => {
    const model = createEditorModel({
      version: 2,
      rows: [{ blocks: [{ type: "heading", id: "heading-1", text: "Title" }] }],
    });
    const selectedBlock = resolveSelectedEditorBlock(model, model.rows[0]?.blocks[0]?.uid ?? "");

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

    expect(screen.getByRole("complementary", { name: "Block inspector" })).toHaveFocus();
  });

  it("calls onClose when Escape is pressed inside the panel", () => {
    const model = createEditorModel({
      version: 2,
      rows: [{ blocks: [{ type: "heading", id: "heading-1", text: "Title" }] }],
    });
    const selectedBlock = resolveSelectedEditorBlock(model, model.rows[0]?.blocks[0]?.uid ?? "");
    const onClose = vi.fn();

    render(
      <BlockInspector
        block={selectedBlock}
        schema={schema}
        data={{}}
        onChangeBlock={() => undefined}
        onRemoveBlock={() => undefined}
        onClose={onClose}
      />,
    );

    fireEvent.keyDown(screen.getByRole("complementary", { name: "Block inspector" }), {
      key: "Escape",
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("restores focus to the previously focused element when the panel closes", () => {
    const model = createEditorModel({
      version: 2,
      rows: [{ blocks: [{ type: "heading", id: "heading-1", text: "Title" }] }],
    });
    const selectedBlock = resolveSelectedEditorBlock(model, model.rows[0]?.blocks[0]?.uid ?? "");

    function Harness({ open }: { open: boolean }) {
      return (
        <>
          <button type="button">trigger</button>
          {open ? (
            <BlockInspector
              block={selectedBlock}
              schema={schema}
              data={{}}
              onChangeBlock={() => undefined}
              onRemoveBlock={() => undefined}
              onClose={() => undefined}
            />
          ) : null}
        </>
      );
    }

    const { rerender } = render(<Harness open={false} />);
    const trigger = screen.getByRole("button", { name: "trigger" });
    trigger.focus();
    expect(trigger).toHaveFocus();

    rerender(<Harness open />);
    expect(screen.getByRole("complementary", { name: "Block inspector" })).toHaveFocus();

    rerender(<Harness open={false} />);
    expect(trigger).toHaveFocus();
  });

  it("shows the empty state when no block is selected", () => {
    const model = createEditorModel({
      version: 2,
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
