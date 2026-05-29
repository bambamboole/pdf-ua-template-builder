import { describe, expect, it } from "vitest";
import type { Template } from "../../types/generated/template";
import type { JsonSchemaObject } from "../../types/template";
import { getPageSize } from "./editorModel";
import { createEditorState, editorReducer } from "./editorReducer";

const template: Template = {
  version: 1,
  rows: [
    {
      blocks: [
        { type: "heading", id: "heading-1", text: "Title" },
        { type: "text", id: "text-1", text: "Body" },
      ],
    },
  ],
};

const schema: JsonSchemaObject = {
  $defs: {
    block: {
      oneOf: [
        { type: "object", properties: { type: { const: "text" } }, required: ["type"] },
      ],
    },
  },
  "x-pdfUa": { blockOrder: ["text"] },
};

function selectedFirstBlock() {
  const initial = createEditorState(template, {});
  const uid = initial.model.rows[0].blocks[0].uid;
  return { state: editorReducer(initial, { type: "selectBlock", blockUid: uid }), uid };
}

describe("editorReducer", () => {
  it("selects and deselects a block", () => {
    const { state, uid } = selectedFirstBlock();
    expect(state.selectedBlockUid).toBe(uid);
    expect(editorReducer(state, { type: "deselect" }).selectedBlockUid).toBeNull();
  });

  it("clears the selection when the selected block is removed", () => {
    const { state, uid } = selectedFirstBlock();

    const next = editorReducer(state, { type: "removeBlock", blockUid: uid });

    expect(next.selectedBlockUid).toBeNull();
    expect(next.model.rows[0].blocks).toHaveLength(1);
  });

  it("keeps the selection when a different block is removed", () => {
    const { state, uid } = selectedFirstBlock();
    const otherUid = state.model.rows[0].blocks[1].uid;

    const next = editorReducer(state, { type: "removeBlock", blockUid: otherUid });

    expect(next.selectedBlockUid).toBe(uid);
  });

  it("updates data without touching the model or selection", () => {
    const { state, uid } = selectedFirstBlock();

    const next = editorReducer(state, { type: "setData", data: { "text-1": [{ a: "1" }] } });

    expect(next.data).toEqual({ "text-1": [{ a: "1" }] });
    expect(next.model).toBe(state.model);
    expect(next.selectedBlockUid).toBe(uid);
  });

  it("loads an example, replacing model and data and clearing selection", () => {
    const { state } = selectedFirstBlock();

    const next = editorReducer(state, {
      type: "loadExample",
      template: { version: 1, rows: [{ blocks: [{ type: "text", id: "only", text: "x" }] }] },
      data: { only: [] },
    });

    expect(next.selectedBlockUid).toBeNull();
    expect(next.data).toEqual({ only: [] });
    expect(next.model.rows[0].blocks[0].block.id).toBe("only");
  });

  it("changes page orientation while preserving the format", () => {
    const initial = createEditorState({ version: 1 }, {});

    const next = editorReducer(initial, { type: "setOrientation", orientation: "landscape" });

    expect(getPageSize(next.model).orientation).toBe("landscape");
  });

  it("adds a default block from the palette", () => {
    const initial = createEditorState({ version: 1 }, {});

    const next = editorReducer(initial, { type: "addBlock", schema, blockType: "text" });

    const added = next.model.rows.at(-1)?.blocks.at(-1)?.block;
    expect(added?.type).toBe("text");
    expect(added?.id).toBe("text-1");
  });

  it("drops a palette block into a brand new row", () => {
    const initial = createEditorState({ version: 1 }, {});

    const next = editorReducer(initial, {
      type: "dropFromPalette",
      schema,
      blockType: "text",
      overId: "new-row",
      overData: {},
    });

    expect(next.model.rows).toHaveLength(1);
    expect(next.model.rows[0].blocks[0].block.type).toBe("text");
  });
});
