import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Block, Template } from "../../types/generated/template";
import { SpacingControls } from "./SpacingControls";

function renderBlockSpacing(initial: Block) {
  const onChangeBlock = vi.fn();

  function Harness() {
    const [block, setBlock] = useState<Block>(initial);

    return (
      <SpacingControls
        scope="block"
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

function renderPageMargins(initial: Template) {
  const onChangeTemplate = vi.fn();

  function Harness() {
    const [template, setTemplate] = useState<Template>(initial);

    return (
      <SpacingControls
        scope="page"
        template={template}
        onChangeTemplate={(next) => {
          onChangeTemplate(next);
          setTemplate(next);
        }}
      />
    );
  }

  render(<Harness />);
  return { onChangeTemplate };
}

describe("SpacingControls", () => {
  it("renders all four side inputs with millimetre labels", () => {
    renderBlockSpacing({
      type: "text",
      text: "Body",
      config: { spacing: { top: 2, right: 4, bottom: 6, left: 8 } },
    });

    const top = screen.getByLabelText("Top (mm)");
    const right = screen.getByLabelText("Right (mm)");
    const bottom = screen.getByLabelText("Bottom (mm)");
    const left = screen.getByLabelText("Left (mm)");

    expect(top).toHaveAttribute("name", "config.spacing.top");
    expect(right).toHaveAttribute("name", "config.spacing.right");
    expect(bottom).toHaveAttribute("name", "config.spacing.bottom");
    expect(left).toHaveAttribute("name", "config.spacing.left");

    expect(top).toHaveValue(2);
    expect(right).toHaveValue(4);
    expect(bottom).toHaveValue(6);
    expect(left).toHaveValue(8);
  });

  it("updates one block spacing side while preserving the others", () => {
    const block = {
      type: "heading",
      text: "Title",
      level: 2,
      config: { spacing: { top: 3, bottom: 9 } },
    } satisfies Block;
    const { onChangeBlock } = renderBlockSpacing(block);

    fireEvent.change(screen.getByLabelText("Right (mm)"), { target: { value: "12" } });

    expect(onChangeBlock).toHaveBeenCalledTimes(1);
    expect(onChangeBlock).toHaveBeenLastCalledWith({
      ...block,
      config: { spacing: { top: 3, bottom: 9, right: 12 } },
    });
  });

  it("prunes block spacing when all sides are cleared", () => {
    const block = {
      type: "divider",
      config: { spacing: { top: 5 } },
    } satisfies Block;
    const { onChangeBlock } = renderBlockSpacing(block);

    fireEvent.change(screen.getByLabelText("Top (mm)"), { target: { value: "" } });

    expect(onChangeBlock).toHaveBeenLastCalledWith({ type: "divider" });
  });

  it("updates page margins while preserving unrelated page config", () => {
    const template = {
      version: 2,
      config: {
        page: {
          locale: "de-DE",
          pageNumbers: { enabled: true, position: "right" },
          margins: { top: 14 },
        },
      },
    } satisfies Template;
    const { onChangeTemplate } = renderPageMargins(template);

    fireEvent.change(screen.getByLabelText("Left (mm)"), { target: { value: "22" } });

    expect(onChangeTemplate).toHaveBeenLastCalledWith({
      ...template,
      config: {
        page: {
          locale: "de-DE",
          pageNumbers: { enabled: true, position: "right" },
          margins: { top: 14, left: 22 },
        },
      },
    });
  });
});
