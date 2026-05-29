import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
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

describe("BlockContentControls", () => {
  it("updates text block content", () => {
    const block = {
      type: "text",
      id: "body",
      text: "Original body",
    } satisfies TextBlock;
    const changes: Block[] = [];
    const element = BlockContentControls({
      block,
      onChangeBlock: (nextBlock) => changes.push(nextBlock),
    });

    expect(renderToStaticMarkup(element)).toContain('name="text"');

    getChangeHandler(requireControl(element, "text"))({
      currentTarget: { value: "Updated body" },
    });

    expect(changes).toEqual([{ ...block, text: "Updated body" }]);
  });

  it("updates heading text and heading level", () => {
    const block = {
      type: "heading",
      id: "title",
      text: "Invoice",
      config: { level: 2 },
    } satisfies HeadingBlock;
    const changes: Block[] = [];
    const element = BlockContentControls({
      block,
      onChangeBlock: (nextBlock) => changes.push(nextBlock),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('name="text"');
    expect(html).toContain('name="config.level"');
    expect(html).toContain('value="2" selected=""');

    getChangeHandler(requireControl(element, "text"))({
      currentTarget: { value: "Updated invoice" },
    });
    getChangeHandler(requireControl(element, "config.level"))({
      currentTarget: { value: "3" },
    });
    getChangeHandler(requireControl(element, "config.level"))({
      currentTarget: { value: "" },
    });

    expect(changes).toEqual([
      { ...block, text: "Updated invoice" },
      { ...block, config: { level: 3 } },
      { type: "heading", id: "title", text: "Invoice" },
    ]);
  });

  it("updates HTML block content in a textarea", () => {
    const block = {
      type: "html",
      id: "terms",
      html: "<p>Terms</p>",
    } satisfies HtmlBlock;
    const changes: Block[] = [];
    const element = BlockContentControls({
      block,
      onChangeBlock: (nextBlock) => changes.push(nextBlock),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("<textarea");
    expect(html).toContain('name="html"');

    getChangeHandler(requireControl(element, "html"))({
      currentTarget: { value: "<p>Updated terms</p>" },
    });

    expect(changes).toEqual([{ ...block, html: "<p>Updated terms</p>" }]);
  });

  it("renders image content fields without duplicated layout controls", () => {
    const block = {
      type: "image",
      id: "logo",
      src: "https://example.com/logo.png",
      alt: "Company logo",
      config: { maxHeight: 24, width: "40mm", align: "right" },
    } satisfies ImageBlock;
    const changes: Block[] = [];
    const element = BlockContentControls({
      block,
      onChangeBlock: (nextBlock) => changes.push(nextBlock),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('name="src"');
    expect(html).toContain('name="alt"');
    expect(html).not.toContain('name="config.maxHeight"');
    expect(html).not.toContain('name="config.width"');
    expect(html).not.toContain('name="config.align"');

    getChangeHandler(requireControl(element, "alt"))({
      currentTarget: { value: "Updated logo" },
    });

    expect(changes).toEqual([{ ...block, alt: "Updated logo" }]);
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

    const html = renderToStaticMarkup(
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

    expect(html).toContain("Content");
    expect(html).toContain('name="text"');
    expect(html).toContain('name="config.level"');
    expect(html).not.toContain("Controls will be added in a later porting slice.</p><");
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

function getChangeHandler(
  element: TestElement,
): (event: { currentTarget: { value: string; valueAsNumber?: number } }) => void {
  const onChange = element.props.onChange;

  if (typeof onChange !== "function") {
    throw new Error("Control has no change handler");
  }

  return onChange as (event: {
    currentTarget: { value: string; valueAsNumber?: number };
  }) => void;
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
