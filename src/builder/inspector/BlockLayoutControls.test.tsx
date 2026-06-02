import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Block, DividerBlock, SpacerBlock, TextBlock } from "../../types/generated/template";
import { BlockLayoutControls } from "./BlockLayoutControls";

function renderControls(initial: Block) {
  const onChangeBlock = vi.fn();

  function Harness() {
    const [block, setBlock] = useState<Block>(initial);

    return (
      <BlockLayoutControls
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

describe("BlockLayoutControls", () => {
  it("renders width as a read-only display and updates align", async () => {
    const user = userEvent.setup();
    const block = {
      type: "text",
      id: "body",
      text: "Body",
      config: { width: "60%", align: "center" },
    } satisfies TextBlock;
    const { onChangeBlock } = renderControls(block);

    const width = screen.getByLabelText("Width");
    expect(width).toHaveValue("60%");
    expect(width).toHaveAttribute("readonly");

    const align = screen.getByLabelText("Align");
    expect(align).toHaveValue("center");
    expect(screen.getByRole("option", { name: "Default" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Right" })).toBeInTheDocument();

    await user.selectOptions(align, "");
    await user.selectOptions(align, "right");

    expect(onChangeBlock.mock.calls).toEqual([
      [{ ...block, config: { width: "60%" } }],
      [{ ...block, config: { width: "60%", align: "right" } }],
    ]);
  });

  it("updates and clears spacer height as a block-specific CSS length field", async () => {
    const user = userEvent.setup();
    const block = {
      type: "spacer",
      id: "gap",
      height: "12mm",
    } satisfies SpacerBlock;
    const { onChangeBlock } = renderControls(block);

    const height = screen.getByLabelText("Height");
    expect(height).toHaveAttribute("type", "text");

    await user.clear(height);
    await user.type(height, "24mm");
    expect(onChangeBlock).toHaveBeenLastCalledWith({ ...block, height: "24mm" });

    await user.clear(height);
    expect(onChangeBlock).toHaveBeenLastCalledWith({ type: "spacer", id: "gap" });
  });

  it("renders and updates divider style as a block-specific enum field", async () => {
    const user = userEvent.setup();
    const block = {
      type: "divider",
      id: "rule",
      thickness: "2px",
      style: "dashed",
    } satisfies DividerBlock;
    const { onChangeBlock } = renderControls(block);

    const style = screen.getByLabelText("Line style");
    expect(style).toHaveValue("dashed");
    expect(within(style).getByRole("option", { name: "Default" })).toBeInTheDocument();
    expect(within(style).getByRole("option", { name: "Double" })).toBeInTheDocument();

    await user.selectOptions(style, "dotted");
    expect(onChangeBlock).toHaveBeenLastCalledWith({
      ...block,
      style: "dotted",
    });

    await user.selectOptions(style, "");
    expect(onChangeBlock).toHaveBeenLastCalledWith({
      type: "divider",
      id: "rule",
      thickness: "2px",
    });
  });
});
