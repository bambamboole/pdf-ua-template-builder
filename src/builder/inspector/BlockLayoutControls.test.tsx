import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Block, DividerBlock, SpacerBlock, TextBlock } from "../../types/generated/template";
import { BlockLayoutControls } from "./BlockLayoutControls";

describe("BlockLayoutControls", () => {
  it("renders width as a read-only display and updates align", () => {
    const block = {
      type: "text",
      id: "body",
      text: "Body",
      config: { width: "60%", align: "center" },
    } satisfies TextBlock;
    const changes: Block[] = [];
    const element = BlockLayoutControls({
      block,
      onChangeBlock: (nextBlock) => changes.push(nextBlock),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Width");
    expect(html).toContain('name="config.width"');
    expect(html).toContain('value="60%"');
    expect(html).toContain("Align");
    expect(html).toContain('name="config.align"');
    expect(html).toContain('<option value="">Default</option>');
    expect(html).toContain('value="center" selected=""');

    expect(requireControl(element, "config.width").props.readOnly).toBe(true);
    expect(requireControl(element, "config.width").props.onChange).toBeUndefined();

    getSelectChangeHandler(requireControl(element, "config.align"))({
      currentTarget: { value: "" },
    });
    getSelectChangeHandler(requireControl(element, "config.align"))({
      currentTarget: { value: "right" },
    });

    expect(changes).toEqual([
      { ...block, config: { width: "60%" } },
      { ...block, config: { width: "60%", align: "right" } },
    ]);
  });

  it("updates and clears spacer height as a block-specific numeric field", () => {
    const block = {
      type: "spacer",
      id: "gap",
      config: { height: 12 },
    } satisfies SpacerBlock;
    const changes: Block[] = [];
    const element = BlockLayoutControls({
      block,
      onChangeBlock: (nextBlock) => changes.push(nextBlock),
    });

    expect(renderToStaticMarkup(element)).toContain("Height");

    getInputChangeHandler(requireControl(element, "config.height"))({
      currentTarget: { value: "24", valueAsNumber: 24 },
    });
    getInputChangeHandler(requireControl(element, "config.height"))({
      currentTarget: { value: "", valueAsNumber: Number.NaN },
    });

    expect(changes).toEqual([{ ...block, config: { height: 24 } }, { type: "spacer", id: "gap" }]);
  });

  it("renders and updates divider style as a block-specific enum field", () => {
    const block = {
      type: "divider",
      id: "rule",
      config: { thickness: 2, style: "dashed" },
    } satisfies DividerBlock;
    const changes: Block[] = [];
    const element = BlockLayoutControls({
      block,
      onChangeBlock: (nextBlock) => changes.push(nextBlock),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Line style");
    expect(html).toContain('name="config.style"');
    expect(html).toContain('<option value="">Default</option>');
    expect(html).toContain('value="dashed" selected=""');
    expect(html).toContain('value="double"');

    getSelectChangeHandler(requireControl(element, "config.style"))({
      currentTarget: { value: "dotted" },
    });
    getSelectChangeHandler(requireControl(element, "config.style"))({
      currentTarget: { value: "" },
    });

    expect(changes).toEqual([
      { ...block, config: { thickness: 2, style: "dotted" } },
      { ...block, config: { thickness: 2 } },
    ]);
  });
});

type TestElement = ReactElement<Record<string, unknown>>;
type TestComponent = (props: Record<string, unknown>) => ReactNode;

function requireControl(node: ReactNode, name: string): TestElement {
  const control = findElement(
    node,
    (element) => isNativeElement(element) && element.props.name === name,
  );

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

  if (isCallableComponent(node.type)) {
    return findElement(node.type(node.props), predicate);
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

function getInputChangeHandler(
  element: TestElement,
): (event: { currentTarget: { value: string; valueAsNumber?: number } }) => void {
  const onChange = element.props.onChange;

  if (typeof onChange !== "function") {
    throw new Error("Control has no input change handler");
  }

  return onChange as (event: {
    currentTarget: { value: string; valueAsNumber?: number };
  }) => void;
}

function getSelectChangeHandler(
  element: TestElement,
): (event: { currentTarget: { value: string } }) => void {
  const onChange = element.props.onChange;

  if (typeof onChange !== "function") {
    throw new Error("Control has no select change handler");
  }

  return onChange as (event: { currentTarget: { value: string } }) => void;
}

function isReactElement(node: ReactNode): node is TestElement {
  return typeof node === "object" && node !== null && "props" in node;
}

function isNativeElement(element: TestElement): boolean {
  return typeof element.type === "string";
}

function isCallableComponent(type: unknown): type is TestComponent {
  if (typeof type !== "function") {
    return false;
  }

  const prototype = (type as { prototype?: { render?: unknown } }).prototype;

  return typeof prototype?.render !== "function";
}
