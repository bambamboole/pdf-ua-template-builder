import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type {
  Block,
  HeadingBlock,
  HtmlBlock,
  ImageBlock,
  TextBlock,
} from "../../types/generated/template";
import type { TemplateSchemaResponse } from "../../types/template";
import { createEditorModel, resolveSelectedEditorBlock } from "../state/editorModel";
import { BlockContentControls } from "./BlockContentControls";
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
    blockOrder: ["heading", "text", "html", "image", "key-value", "table", "spacer", "divider"],
    pageFormats: [],
  },
} satisfies TemplateSchemaResponse;

function renderControls(initial: Block) {
  const onChangeBlock = vi.fn();

  function Harness() {
    const [block, setBlock] = useState<Block>(initial);

    return (
      <BlockContentControls
        block={block}
        onChangeBlock={(next) => {
          onChangeBlock(next);
          setBlock(next);
        }}
      />
    );
  }

  render(<Harness />);
  return { onChangeBlock };
}

describe("BlockContentControls", () => {
  it("updates text block content", async () => {
    const user = userEvent.setup();
    const block = {
      type: "text",
      id: "body",
      text: "Original body",
    } satisfies TextBlock;
    const { onChangeBlock } = renderControls(block);

    const textInput = screen.getByLabelText("Text");
    expect(textInput).toHaveValue("Original body");

    await user.clear(textInput);
    await user.type(textInput, "Updated body");

    expect(textInput).toHaveValue("Updated body");
    expect(onChangeBlock).toHaveBeenLastCalledWith({ ...block, text: "Updated body" });
  });

  it("updates heading text and heading level", async () => {
    const user = userEvent.setup();
    const block = {
      type: "heading",
      id: "title",
      text: "Invoice",
      config: { level: 2 },
    } satisfies HeadingBlock;
    const { onChangeBlock } = renderControls(block);

    const textInput = screen.getByLabelText("Text");
    const levelSelect = screen.getByLabelText("Level");

    expect(textInput).toHaveValue("Invoice");
    expect(levelSelect).toHaveValue("2");

    await user.clear(textInput);
    await user.type(textInput, "Updated invoice");
    expect(onChangeBlock).toHaveBeenLastCalledWith(
      expect.objectContaining({ text: "Updated invoice" }),
    );

    await user.selectOptions(levelSelect, "3");
    expect(onChangeBlock).toHaveBeenLastCalledWith(
      expect.objectContaining({ config: { level: 3 } }),
    );

    await user.selectOptions(levelSelect, "Default");
    expect(onChangeBlock).toHaveBeenLastCalledWith({
      type: "heading",
      id: "title",
      text: "Updated invoice",
    });
  });

  it("updates HTML block content in a textarea", async () => {
    const user = userEvent.setup();
    const block = {
      type: "html",
      id: "terms",
      html: "<p>Terms</p>",
    } satisfies HtmlBlock;
    const { onChangeBlock } = renderControls(block);

    const htmlInput = screen.getByLabelText("HTML");
    expect(htmlInput.tagName).toBe("TEXTAREA");
    expect(htmlInput).toHaveValue("<p>Terms</p>");

    await user.clear(htmlInput);
    await user.type(htmlInput, "<p>Updated terms</p>");

    expect(onChangeBlock).toHaveBeenLastCalledWith({ ...block, html: "<p>Updated terms</p>" });
  });

  it("renders image content fields without duplicated layout controls", async () => {
    const user = userEvent.setup();
    const block = {
      type: "image",
      id: "logo",
      src: "https://example.com/logo.png",
      alt: "Company logo",
      config: { maxHeight: 24, width: "40mm", align: "right" },
    } satisfies ImageBlock;
    const { onChangeBlock } = renderControls(block);

    expect(screen.getByLabelText("Source")).toHaveValue("https://example.com/logo.png");
    expect(screen.getByLabelText("Alt text")).toHaveValue("Company logo");
    expect(screen.queryByLabelText("Max height")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Width")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Align")).not.toBeInTheDocument();

    const altInput = screen.getByLabelText("Alt text");
    await user.clear(altInput);
    await user.type(altInput, "Updated logo");

    expect(onChangeBlock).toHaveBeenLastCalledWith(
      expect.objectContaining({ alt: "Updated logo" }),
    );
  });
});

describe("BlockInspector content section", () => {
  it("renders selected known block content controls", () => {
    const model = createEditorModel({
      version: 1,
      rows: [{ blocks: [{ type: "heading", id: "heading-1", text: "Title" }] }],
    });
    const selectedUid = model.rows[0]?.blocks[0]?.uid ?? "";
    const selectedBlock = resolveSelectedEditorBlock(model, selectedUid);

    render(
      <BlockInspector
        block={selectedBlock}
        schema={schema}
        data={{}}
        onChangeBlock={() => undefined}
        onChangeData={() => undefined}
        onRemoveBlock={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByLabelText("Text")).toBeInTheDocument();
    expect(screen.getByLabelText("Level")).toBeInTheDocument();
    expect(
      screen.queryByText("Controls will be added in a later porting slice."),
    ).not.toBeInTheDocument();
  });
});
