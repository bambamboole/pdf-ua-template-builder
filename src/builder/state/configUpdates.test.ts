import { describe, expect, it } from "vitest";
import type { Block, Template } from "../../types/generated/template";
import {
  setBlockConfigField,
  setBlockSpacingField,
  setBlockTypographyField,
  setTemplatePageMargin,
  setTemplateTypographyField,
} from "./configUpdates";

describe("config updates", () => {
  it("sets and clears block width and align", () => {
    const block = {
      type: "text",
      id: "body",
      text: "Body",
    } satisfies Block;

    const sized = setBlockConfigField(block, "width", "60%");
    const aligned = setBlockConfigField(sized, "align", "center");

    expect(aligned).toEqual({
      ...block,
      config: { width: "60%", align: "center" },
    });

    const withoutWidth = setBlockConfigField(aligned, "width", "");
    const withoutAlign = setBlockConfigField(withoutWidth, "align", undefined);

    expect(withoutWidth).toEqual({ ...block, config: { align: "center" } });
    expect(withoutAlign).toEqual(block);
  });

  it("sets and clears block typography while pruning empty nested config", () => {
    const block = {
      type: "heading",
      id: "title",
      text: "Title",
      config: { level: 2 },
    } satisfies Block;

    const withFamily = setBlockTypographyField(block, "family", "Inter");
    const withSize = setBlockTypographyField(withFamily, "size", 14);

    expect(withSize).toEqual({
      ...block,
      config: { level: 2, typography: { family: "Inter", size: 14 } },
    });

    const withoutFamily = setBlockTypographyField(withSize, "family", null);
    const withoutSize = setBlockTypographyField(withoutFamily, "size", undefined);

    expect(withoutFamily).toEqual({
      ...block,
      config: { level: 2, typography: { size: 14 } },
    });
    expect(withoutSize).toEqual(block);
  });

  it("sets and clears block spacing while pruning empty block config", () => {
    const block = {
      type: "divider",
      id: "rule",
    } satisfies Block;

    const withTop = setBlockSpacingField(block, "top", 8);
    const withBottom = setBlockSpacingField(withTop, "bottom", 4);

    expect(withBottom).toEqual({
      ...block,
      config: { spacing: { top: 8, bottom: 4 } },
    });

    const withoutTop = setBlockSpacingField(withBottom, "top", undefined);
    const withoutBottom = setBlockSpacingField(withoutTop, "bottom", null);

    expect(withoutTop).toEqual({ ...block, config: { spacing: { bottom: 4 } } });
    expect(withoutBottom).toEqual(block);
  });

  it("sets template typography and page margins while preserving footer and page numbers", () => {
    const template = {
      version: 1,
      config: {
        page: {
          pageNumbers: { enabled: true, position: "center" },
          footer: {
            repeat: true,
            rows: [{ blocks: [{ type: "text", id: "footer", text: "Footer" }] }],
          },
        },
      },
    } satisfies Template;

    const withFont = setTemplateTypographyField(template, "family", "Source Sans 3");
    const withTopMargin = setTemplatePageMargin(withFont, "top", 20);
    const withLeftMargin = setTemplatePageMargin(withTopMargin, "left", 25);

    expect(withLeftMargin).toEqual({
      ...template,
      config: {
        typography: { family: "Source Sans 3" },
        page: {
          pageNumbers: { enabled: true, position: "center" },
          footer: {
            repeat: true,
            rows: [{ blocks: [{ type: "text", id: "footer", text: "Footer" }] }],
          },
          margins: { top: 20, left: 25 },
        },
      },
    });

    const withoutTopMargin = setTemplatePageMargin(withLeftMargin, "top", "");
    const withoutLeftMargin = setTemplatePageMargin(withoutTopMargin, "left", undefined);
    const withoutFont = setTemplateTypographyField(withoutLeftMargin, "family", null);

    expect(withoutTopMargin.config?.page).toEqual({
      pageNumbers: { enabled: true, position: "center" },
      footer: {
        repeat: true,
        rows: [{ blocks: [{ type: "text", id: "footer", text: "Footer" }] }],
      },
      margins: { left: 25 },
    });
    expect(withoutLeftMargin.config?.page).toEqual(template.config?.page);
    expect(withoutFont).toEqual(template);
  });
});
