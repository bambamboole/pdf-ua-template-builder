import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Block, ImageBlock } from "../../../types/generated/template";
import { ImageBlockEditor } from "./ImageBlockEditor";

const baseBlock = {
  type: "image",
  id: "logo",
  src: "https://example.com/logo.png",
  alt: "Company logo",
  maxHeight: "28px",
} satisfies ImageBlock;

function renderEditor(initial: Block = baseBlock) {
  const onChangeBlock = vi.fn();

  function Harness() {
    const [block, setBlock] = useState<Block>(initial);

    return (
      <ImageBlockEditor
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

describe("ImageBlockEditor", () => {
  it("renders the preview, source, and alt fields from the block", () => {
    renderEditor();

    expect(screen.getByRole("img", { name: "Company logo" })).toHaveAttribute(
      "src",
      "https://example.com/logo.png",
    );
    expect(screen.getByLabelText("Source")).toHaveValue("https://example.com/logo.png");
    expect(screen.getByLabelText("Alt text")).toHaveValue("Company logo");
    expect(screen.getByLabelText("Upload")).toHaveAttribute("type", "file");
  });

  it("updates block.alt as the alt text is edited", async () => {
    const user = userEvent.setup();
    const { onChangeBlock } = renderEditor();
    const altInput = screen.getByLabelText("Alt text");

    await user.clear(altInput);
    await user.type(altInput, "Updated logo");

    expect(altInput).toHaveValue("Updated logo");
    expect(onChangeBlock).toHaveBeenLastCalledWith(
      expect.objectContaining({ alt: "Updated logo" }),
    );
  });

  it("updates block.src as the source is edited", async () => {
    const user = userEvent.setup();
    const { onChangeBlock } = renderEditor();
    const srcInput = screen.getByLabelText("Source");

    await user.clear(srcInput);
    await user.type(srcInput, "data:image/svg+xml;base64,Zm9v");

    expect(onChangeBlock).toHaveBeenLastCalledWith(
      expect.objectContaining({ src: "data:image/svg+xml;base64,Zm9v" }),
    );
  });

  it("shows a placeholder when no image is selected", () => {
    renderEditor({ type: "image", src: "" } satisfies ImageBlock);

    expect(screen.getByText("No image selected")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
