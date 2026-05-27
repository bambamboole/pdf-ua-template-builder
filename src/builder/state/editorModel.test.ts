import { describe, expect, it } from "vitest";
import type { Block, Template } from "../../types/generated/template";
import {
  addBlockToNewRow,
  addBlockToRow,
  createEditorModel,
  moveBlock,
  moveRow,
  removeBlock,
  serializeTemplate,
  setRowWidths,
  updateBlock,
} from "./editorModel";

const headingBlock = {
  type: "heading",
  id: "heading-1",
  text: "Title",
} satisfies Block;

const textBlock = {
  type: "text",
  id: "text-1",
  text: "Body",
} satisfies Block;

const dividerBlock = {
  type: "divider",
  id: "divider-1",
} satisfies Block;

const template = {
  version: 1,
  config: { page: { locale: "en-US" } },
  rows: [{ blocks: [headingBlock] }, { blocks: [textBlock] }],
} satisfies Template;

describe("editor model", () => {
  it("adds runtime uids to rows and blocks and serializes without them", () => {
    const model = createEditorModel(template);

    expect(model.template).toEqual({
      version: 1,
      config: { page: { locale: "en-US" } },
    });
    expect(model.rows).toHaveLength(2);
    expect(model.rows[0]?.uid).toEqual(expect.any(String));
    expect(model.rows[0]?.blocks[0]?.uid).toEqual(expect.any(String));
    expect(model.rows[0]?.blocks[0]?.block).toEqual(headingBlock);
    expect(serializeTemplate(model)).toEqual(template);
  });

  it("clones blocks when ingesting and serializing", () => {
    const model = createEditorModel(template);

    expect(model.rows[0]?.blocks[0]?.block).not.toBe(template.rows?.[0]?.blocks[0]);
    expect(serializeTemplate(model).rows?.[0]?.blocks[0]).not.toBe(model.rows[0]?.blocks[0]?.block);
  });

  it("adds blocks to new and existing rows and serializes to the original block shape", () => {
    const model = createEditorModel({ version: 1 });
    const withNewRow = addBlockToNewRow(model, headingBlock);
    const rowUid = withNewRow.rows[0]?.uid;
    const withExistingRow = addBlockToRow(withNewRow, rowUid ?? "", textBlock, 1);

    expect(serializeTemplate(withExistingRow)).toEqual({
      version: 1,
      rows: [{ blocks: [headingBlock, textBlock] }],
    });
  });

  it("moves blocks and rows", () => {
    const model = createEditorModel({
      version: 1,
      rows: [{ blocks: [headingBlock] }, { blocks: [textBlock] }, { blocks: [dividerBlock] }],
    });
    const headingUid = model.rows[0]?.blocks[0]?.uid ?? "";
    const textUid = model.rows[1]?.blocks[0]?.uid ?? "";
    const dividerUid = model.rows[2]?.blocks[0]?.uid ?? "";
    const secondRowUid = model.rows[1]?.uid ?? "";

    const withHeadingMoved = moveBlock(model, headingUid, secondRowUid, 1);
    const withDividerMoved = moveBlock(withHeadingMoved, dividerUid, secondRowUid, 2);
    const withRowMoved = moveRow(withDividerMoved, secondRowUid, 0);

    expect(textUid).toEqual(expect.any(String));
    expect(serializeTemplate(withRowMoved).rows?.[0]?.blocks.map((block) => block.type)).toEqual([
      "text",
      "heading",
      "divider",
    ]);
  });

  it("moves a block to a new row at the end", () => {
    const model = createEditorModel(template);
    const headingUid = model.rows[0]?.blocks[0]?.uid ?? "";
    const moved = moveBlock(model, headingUid, null, 0);

    expect(
      serializeTemplate(moved).rows?.map((row) => row.blocks.map((block) => block.type)),
    ).toEqual([["text"], ["heading"]]);
  });

  it("keeps a block when moving within its current single-block row", () => {
    const model = createEditorModel(template);
    const rowUid = model.rows[0]?.uid ?? "";
    const headingUid = model.rows[0]?.blocks[0]?.uid ?? "";
    const moved = moveBlock(model, headingUid, rowUid, 0);

    expect(serializeTemplate(moved).rows?.[0]?.blocks).toEqual([headingBlock]);
  });

  it("removes and updates blocks", () => {
    const model = createEditorModel(template);
    const headingUid = model.rows[0]?.blocks[0]?.uid ?? "";
    const textUid = model.rows[1]?.blocks[0]?.uid ?? "";
    const updated = updateBlock(model, headingUid, { ...headingBlock, text: "Updated" });
    const removed = removeBlock(updated, textUid);

    expect(serializeTemplate(removed)).toEqual({
      version: 1,
      config: { page: { locale: "en-US" } },
      rows: [{ blocks: [{ ...headingBlock, text: "Updated" }] }],
    });
  });

  it("writes row widths into block config while preserving existing config", () => {
    const model = createEditorModel({
      version: 1,
      rows: [
        {
          blocks: [
            { ...headingBlock, config: { level: 2 } },
            { ...textBlock, config: { align: "center" } },
          ],
        },
      ],
    });
    const rowUid = model.rows[0]?.uid ?? "";
    const resized = setRowWidths(model, rowUid, ["60%", "40%"]);

    expect(serializeTemplate(resized).rows?.[0]?.blocks).toEqual([
      { ...headingBlock, config: { level: 2, width: "60%" } },
      { ...textBlock, config: { align: "center", width: "40%" } },
    ]);
  });
});
