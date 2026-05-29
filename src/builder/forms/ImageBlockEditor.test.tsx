import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Block, ImageBlock } from "../../types/generated/template";
import { ImageBlockEditor } from "./ImageBlockEditor";

const baseBlock = {
  type: "image",
  id: "logo",
  src: "https://example.com/logo.png",
  alt: "Company logo",
  config: { maxHeight: 28 },
} satisfies ImageBlock;

describe("ImageBlockEditor", () => {
  it("renders a preview, alt text input, and a file picker", () => {
    const html = renderToStaticMarkup(
      <ImageBlockEditor block={baseBlock} onChangeBlock={() => undefined} />,
    );

    expect(html).toContain('src="https://example.com/logo.png"');
    expect(html).toContain('alt="Company logo"');
    expect(html).toContain('value="Company logo"');
    expect(html).toContain('type="file"');
    expect(html).toContain('value="https://example.com/logo.png"');
  });

  it("updates block.alt when the alt input changes", () => {
    const changes: Block[] = [];
    const element = ImageBlockEditor({
      block: baseBlock,
      onChangeBlock: (block) => changes.push(block),
    });
    const control = requireControl(element, "alt");

    getChangeHandler(control)({ currentTarget: { value: "Updated logo" } });

    expect(changes[0]).toEqual({ ...baseBlock, alt: "Updated logo" });
  });

  it("updates block.src when the src input changes", () => {
    const changes: Block[] = [];
    const element = ImageBlockEditor({
      block: baseBlock,
      onChangeBlock: (block) => changes.push(block),
    });
    const control = requireControl(element, "src");

    getChangeHandler(control)({ currentTarget: { value: "data:image/svg+xml;base64,Zm9v" } });

    expect(changes[0]).toEqual({ ...baseBlock, src: "data:image/svg+xml;base64,Zm9v" });
  });

  it("updates config.maxHeight when the number input changes", () => {
    const changes: Block[] = [];
    const element = ImageBlockEditor({
      block: baseBlock,
      onChangeBlock: (block) => changes.push(block),
    });
    const control = requireControl(element, "config.maxHeight");

    getChangeHandler(control)({
      currentTarget: { value: "42", valueAsNumber: 42 },
    });

    expect(changes[0]).toEqual({
      ...baseBlock,
      config: { maxHeight: 42 },
    });
  });

  it("removes config.maxHeight when the value is cleared", () => {
    const changes: Block[] = [];
    const element = ImageBlockEditor({
      block: baseBlock,
      onChangeBlock: (block) => changes.push(block),
    });
    const control = requireControl(element, "config.maxHeight");

    getChangeHandler(control)({
      currentTarget: { value: "", valueAsNumber: Number.NaN },
    });

    expect(changes[0]).toEqual({
      type: "image",
      id: "logo",
      src: baseBlock.src,
      alt: "Company logo",
    });
  });

  it("falls back to a placeholder when src is empty", () => {
    const emptyBlock = { type: "image", src: "" } satisfies ImageBlock;
    const html = renderToStaticMarkup(
      <ImageBlockEditor block={emptyBlock} onChangeBlock={() => undefined} />,
    );

    expect(html).toContain("No image selected");
  });
});

type TestElement = ReactElement<Record<string, unknown>>;

function requireControl(node: ReactNode, name: string): TestElement {
  const control = findElement(
    node,
    (element) => element.props.name === name || element.props["data-name"] === name,
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

function getChangeHandler(
  element: TestElement,
): (event: { currentTarget: { value: string; valueAsNumber?: number } }) => void {
  const onChange = element.props.onChange;

  if (typeof onChange !== "function") {
    throw new Error("Control has no change handler");
  }

  return onChange as (event: { currentTarget: { value: string; valueAsNumber?: number } }) => void;
}

function isReactElement(node: ReactNode): node is TestElement {
  return typeof node === "object" && node !== null && "props" in node;
}
