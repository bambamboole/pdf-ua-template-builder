import { describe, expect, it } from "vitest";
import type { Block, Template } from "../../types/generated/template";
import {
  addBlockToNewRow,
  addBlockToRow,
  createEditorModel,
  createNextBlockId,
  getFooterRepeat,
  getPageNumbers,
  getPageSize,
  moveBlock,
  moveRow,
  reconcileSelectedBlockUid,
  removeBlock,
  resolveSelectedEditorBlock,
  serializeTemplate,
  setFooterRepeat,
  setPageNumbers,
  setPageSize,
  setRowWidths,
  updateTemplateSettings,
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

  it("reorders blocks within a shared row", () => {
    const model = createEditorModel({
      version: 1,
      rows: [{ blocks: [headingBlock, textBlock, dividerBlock] }],
    });
    const rowUid = model.rows[0]?.uid ?? "";
    const headingUid = model.rows[0]?.blocks[0]?.uid ?? "";
    const dividerUid = model.rows[0]?.blocks[2]?.uid ?? "";

    const headingToEnd = moveBlock(model, headingUid, rowUid, 2);
    const dividerToFront = moveBlock(model, dividerUid, rowUid, 0);

    expect(serializeTemplate(headingToEnd).rows?.[0]?.blocks.map((block) => block.type)).toEqual([
      "text",
      "divider",
      "heading",
    ]);
    expect(serializeTemplate(dividerToFront).rows?.[0]?.blocks.map((block) => block.type)).toEqual([
      "divider",
      "heading",
      "text",
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

  it("ingests footer rows from template.config.page.footer and round-trips them", () => {
    const model = createEditorModel({
      version: 1,
      config: {
        page: {
          footer: {
            repeat: true,
            rows: [{ blocks: [{ type: "text", id: "footer-legal", text: "Legal text" }] }],
          },
        },
      },
      rows: [{ blocks: [headingBlock] }],
    });

    expect(model.footerRows).toHaveLength(1);
    expect(model.footerRows[0]?.blocks[0]?.block).toEqual({
      type: "text",
      id: "footer-legal",
      text: "Legal text",
    });
    expect(model.template.config?.page?.footer).toEqual({ repeat: true });
    expect(serializeTemplate(model).config?.page?.footer).toEqual({
      repeat: true,
      rows: [{ blocks: [{ type: "text", id: "footer-legal", text: "Legal text" }] }],
    });
  });

  it("adds blocks to a footer area and finds rows by uid across both areas", () => {
    const model = createEditorModel({ version: 1, rows: [{ blocks: [headingBlock] }] });
    const withFooterBlock = addBlockToNewRow(model, textBlock, "footer");
    const footerRowUid = withFooterBlock.footerRows[0]?.uid ?? "";
    const withSecondFooter = addBlockToRow(withFooterBlock, footerRowUid, dividerBlock, 1);

    expect(withSecondFooter.rows[0]?.blocks).toHaveLength(1);
    expect(withSecondFooter.footerRows[0]?.blocks.map((b) => b.block.type)).toEqual([
      "text",
      "divider",
    ]);
    expect(serializeTemplate(withSecondFooter).config?.page?.footer?.rows?.[0]?.blocks).toEqual([
      textBlock,
      dividerBlock,
    ]);
  });

  it("moves a block from the body into a new footer row", () => {
    const model = createEditorModel({ version: 1, rows: [{ blocks: [headingBlock, textBlock] }] });
    const textUid = model.rows[0]?.blocks[1]?.uid ?? "";
    const moved = moveBlock(model, textUid, null, 0, "footer");

    expect(moved.rows[0]?.blocks.map((b) => b.block.type)).toEqual(["heading"]);
    expect(moved.footerRows[0]?.blocks.map((b) => b.block.type)).toEqual(["text"]);
  });

  it("reads, sets, and disables page numbers", () => {
    const model = createEditorModel({ version: 1 });

    expect(getPageNumbers(model)).toBe("disabled");

    const enabled = setPageNumbers(model, "center");
    expect(getPageNumbers(enabled)).toBe("center");
    expect(serializeTemplate(enabled).config?.page?.pageNumbers).toEqual({
      enabled: true,
      position: "center",
    });

    const disabled = setPageNumbers(enabled, "disabled");
    expect(getPageNumbers(disabled)).toBe("disabled");
    expect(serializeTemplate(disabled).config?.page?.pageNumbers).toEqual({
      enabled: false,
      position: "center",
    });
  });

  it("reads and sets the footer repeat flag", () => {
    const model = createEditorModel({ version: 1 });

    expect(getFooterRepeat(model)).toBe(true);

    const off = setFooterRepeat(model, false);
    expect(getFooterRepeat(off)).toBe(false);
    expect(serializeTemplate(off).config?.page?.footer).toEqual({ repeat: false });
  });

  it("returns a default A4 portrait page size when not set", () => {
    const model = createEditorModel({ version: 1 });

    expect(getPageSize(model)).toEqual({
      format: "A4",
      orientation: "portrait",
      custom: null,
    });
  });

  it("reads preset format and orientation from the template", () => {
    const model = createEditorModel({
      version: 1,
      config: { page: { size: { format: "Letter", orientation: "landscape" } } },
    });

    expect(getPageSize(model)).toEqual({
      format: "Letter",
      orientation: "landscape",
      custom: null,
    });
  });

  it("writes page size while preserving other page config", () => {
    const model = createEditorModel({
      version: 1,
      config: { page: { locale: "de_DE" } },
    });
    const next = setPageSize(model, "A5", "landscape");

    expect(serializeTemplate(next).config).toEqual({
      page: {
        locale: "de_DE",
        size: { format: "A5", orientation: "landscape" },
      },
    });
  });

  it("updates document settings without replacing editable body or footer rows", () => {
    const model = createEditorModel({
      version: 1,
      config: {
        page: {
          footer: {
            repeat: false,
            rows: [{ blocks: [{ type: "text", id: "footer", text: "Footer" }] }],
          },
        },
      },
      rows: [{ blocks: [headingBlock] }],
    });
    const bodyRowUid = model.rows[0]?.uid;
    const footerRowUid = model.footerRows[0]?.uid;
    const next = updateTemplateSettings(model, {
      ...serializeTemplate(model),
      config: {
        page: {
          footer: {
            repeat: true,
            rows: [{ blocks: [{ type: "text", id: "footer", text: "Footer" }] }],
          },
          pageNumbers: { enabled: true, position: "center" },
          margins: { top: 18 },
        },
      },
    });

    expect(next.rows[0]?.uid).toBe(bodyRowUid);
    expect(next.footerRows[0]?.uid).toBe(footerRowUid);
    expect(serializeTemplate(next)).toEqual({
      version: 1,
      config: {
        page: {
          footer: {
            repeat: true,
            rows: [{ blocks: [{ type: "text", id: "footer", text: "Footer" }] }],
          },
          pageNumbers: { enabled: true, position: "center" },
          margins: { top: 18 },
        },
      },
      rows: [{ blocks: [headingBlock] }],
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

  it("omits width for blocks without a provided width instead of writing undefined", () => {
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
    const resized = setRowWidths(model, rowUid, ["60%"]);
    const blocks = serializeTemplate(resized).rows?.[0]?.blocks;

    expect(blocks?.[0]).toStrictEqual({ ...headingBlock, config: { level: 2, width: "60%" } });
    expect(blocks?.[1]).toStrictEqual({ ...textBlock, config: { align: "center" } });
  });

  it("clears width and prunes empty config when an empty width is provided", () => {
    const model = createEditorModel({
      version: 1,
      rows: [{ blocks: [{ ...textBlock, config: { width: "40%" } }] }],
    });
    const rowUid = model.rows[0]?.uid ?? "";
    const cleared = setRowWidths(model, rowUid, [""]);

    expect(serializeTemplate(cleared).rows?.[0]?.blocks?.[0]).toStrictEqual(textBlock);
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

  it("avoids ids already used by footer blocks", () => {
    const model = createEditorModel({
      version: 1,
      config: {
        page: {
          footer: { rows: [{ blocks: [{ type: "text", id: "text-1", text: "Legal" }] }] },
        },
      },
      rows: [{ blocks: [headingBlock] }],
    });

    expect(createNextBlockId(model, "text")).toBe("text-2");
  });
});

describe("resolveSelectedEditorBlock", () => {
  it("resolves a known uid and returns null otherwise", () => {
    const model = createEditorModel({
      version: 1,
      rows: [{ blocks: [{ type: "heading", id: "heading-1", text: "Title" }] }],
    });
    const uid = model.rows[0]?.blocks[0]?.uid ?? "";

    expect(resolveSelectedEditorBlock(model, uid)?.block.id).toBe("heading-1");
    expect(resolveSelectedEditorBlock(model, "missing")).toBeNull();
    expect(resolveSelectedEditorBlock(model, null)).toBeNull();
  });
});

describe("reconcileSelectedBlockUid", () => {
  it("keeps a uid that still exists and clears one that does not", () => {
    const model = createEditorModel({
      version: 1,
      rows: [{ blocks: [{ type: "heading", id: "heading-1", text: "Title" }] }],
    });
    const uid = model.rows[0]?.blocks[0]?.uid ?? "";
    const without = createEditorModel({
      version: 1,
      rows: [{ blocks: [{ type: "text", id: "text-1", text: "Body" }] }],
    });

    expect(reconcileSelectedBlockUid(model, uid)).toBe(uid);
    expect(reconcileSelectedBlockUid(without, uid)).toBeNull();
    expect(reconcileSelectedBlockUid(model, null)).toBeNull();
  });
});
