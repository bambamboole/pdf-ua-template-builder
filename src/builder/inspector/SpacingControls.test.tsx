import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Block, Template } from "../../types/generated/template";
import { SpacingControls } from "./SpacingControls";

describe("SpacingControls", () => {
  it("renders all four side inputs with millimetre labels", () => {
    const html = renderToStaticMarkup(
      <SpacingControls
        scope="block"
        block={{
          type: "text",
          text: "Body",
          config: { spacing: { top: 2, right: 4, bottom: 6, left: 8 } },
        }}
        onChangeBlock={() => undefined}
      />,
    );

    expect(html).toContain("Top (mm)");
    expect(html).toContain("Right (mm)");
    expect(html).toContain("Bottom (mm)");
    expect(html).toContain("Left (mm)");
    expect(html).toContain('name="config.spacing.top"');
    expect(html).toContain('name="config.spacing.right"');
    expect(html).toContain('name="config.spacing.bottom"');
    expect(html).toContain('name="config.spacing.left"');
  });

  it("updates one block spacing side while preserving the others", () => {
    const block = {
      type: "heading",
      text: "Title",
      config: { level: 2, spacing: { top: 3, bottom: 9 } },
    } satisfies Block;
    const changes: Block[] = [];
    const element = SpacingControls({
      scope: "block",
      block,
      onChangeBlock: (nextBlock) => changes.push(nextBlock),
    });

    getNumberChangeHandler(requireControl(element, "config.spacing.right"))(12);

    expect(changes).toEqual([
      {
        ...block,
        config: { level: 2, spacing: { top: 3, bottom: 9, right: 12 } },
      },
    ]);
  });

  it("prunes block spacing when all sides are cleared", () => {
    const block = {
      type: "divider",
      config: { spacing: { top: 5 } },
    } satisfies Block;
    const changes: Block[] = [];
    const element = SpacingControls({
      scope: "block",
      block,
      onChangeBlock: (nextBlock) => changes.push(nextBlock),
    });

    getNumberChangeHandler(requireControl(element, "config.spacing.top"))(undefined);

    expect(changes).toEqual([{ type: "divider" }]);
  });

  it("updates page margins while preserving unrelated page config", () => {
    const template = {
      version: 1,
      config: {
        page: {
          locale: "de-DE",
          pageNumbers: { enabled: true, position: "right" },
          margins: { top: 14 },
        },
      },
    } satisfies Template;
    const changes: Template[] = [];
    const element = SpacingControls({
      scope: "page",
      template,
      onChangeTemplate: (nextTemplate) => changes.push(nextTemplate),
    });

    getNumberChangeHandler(requireControl(element, "config.page.margins.left"))(22);

    expect(changes).toEqual([
      {
        ...template,
        config: {
          page: {
            locale: "de-DE",
            pageNumbers: { enabled: true, position: "right" },
            margins: { top: 14, left: 22 },
          },
        },
      },
    ]);
  });
});

type TestElement = ReactElement<Record<string, unknown>>;

function requireControl(node: ReactNode, name: string): TestElement {
  const control = findElement(node, (element) => element.props.name === name);

  if (!control) {
    throw new Error(`Control not found: ${name}`);
  }

  return control;
}

function findElement(
  node: ReactNode,
  predicate: (element: TestElement) => boolean,
): TestElement | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, predicate);

      if (match) {
        return match;
      }
    }

    return undefined;
  }

  if (!isReactElement(node)) {
    return undefined;
  }

  if (predicate(node)) {
    return node;
  }

  const children = node.props.children;
  const childNodes = Array.isArray(children) ? children : [children];

  for (const child of childNodes) {
    const match = findElement(child, predicate);

    if (match) {
      return match;
    }
  }

  return undefined;
}

function getNumberChangeHandler(element: TestElement): (value: number | undefined) => void {
  const onChange = element.props.onChange;

  if (typeof onChange !== "function") {
    throw new Error("Control has no change handler");
  }

  return onChange as (value: number | undefined) => void;
}

function isReactElement(node: ReactNode): node is TestElement {
  return typeof node === "object" && node !== null && "props" in node;
}
