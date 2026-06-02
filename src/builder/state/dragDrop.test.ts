import { describe, expect, it } from "vitest";
import { getDropTarget, getRowIndex } from "./dragDrop";
import { createEditorModel } from "./editorModel";

describe("getRowIndex", () => {
  it("resolves row drops over nested blocks to the block row", () => {
    const model = createEditorModel({
      version: 2,
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

  it("returns null when the target row is not found", () => {
    const model = createEditorModel({ version: 2, rows: [] });

    expect(getRowIndex(model, "missing", {})).toBeNull();
  });
});

describe("getDropTarget", () => {
  it("targets a new body row for the new-row sentinel", () => {
    const model = createEditorModel({ version: 2, rows: [] });

    expect(getDropTarget(model, "new-row", {})).toEqual({ rowUid: null, index: 0, area: "body" });
  });

  it("targets a new footer row for the new-footer-row sentinel", () => {
    const model = createEditorModel({ version: 2, rows: [] });

    expect(getDropTarget(model, "new-footer-row", {})).toEqual({
      rowUid: null,
      index: 0,
      area: "footer",
    });
  });
});
