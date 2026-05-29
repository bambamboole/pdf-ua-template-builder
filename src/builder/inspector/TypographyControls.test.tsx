import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Block, Template } from "../../types/generated/template";
import type { TemplateSchemaMetadata } from "../../types/template";
import { TypographyControls } from "./TypographyControls";

const metadata = {
  kind: "template",
  templateVersion: 1,
  renderEndpoint: "/render/template",
  templateFields: ["version", "rows"],
  attachmentFields: [],
  externalFontFields: [],
  bundledFonts: ["Inter", "Source Sans 3"],
  blockOrder: ["heading", "text"],
  pageFormats: [{ name: "A4", widthMm: 210, heightMm: 297 }],
} satisfies TemplateSchemaMetadata;

describe("TypographyControls", () => {
  it("renders family, size, weight, align, and color fields", () => {
    const html = renderToStaticMarkup(
      <TypographyControls
        target="block"
        block={{
          type: "heading",
          text: "Title",
          config: {
            typography: {
              family: "Inter",
              size: 14,
              weight: 700,
              align: "center",
              color: "#112233",
            },
          },
        }}
        metadata={metadata}
        onChangeBlock={() => undefined}
      />,
    );

    expect(html).toContain("Family");
    expect(html).toContain('name="config.typography.family"');
    expect(html).toContain("Size");
    expect(html).toContain('name="config.typography.size"');
    expect(html).toContain("Weight");
    expect(html).toContain('name="config.typography.weight"');
    expect(html).toContain("Align");
    expect(html).toContain('name="config.typography.align"');
    expect(html).toContain("Color");
    expect(html).toContain('name="config.typography.color"');
  });

  it("updates and clears block typography through nested block config", () => {
    const changes: Block[] = [];
    const block = {
      type: "heading",
      text: "Title",
      config: { level: 2 },
    } satisfies Block;
    const element = TypographyControls({
      target: "block",
      block,
      metadata,
      onChangeBlock: (nextBlock) => changes.push(nextBlock),
    });

    getChangeHandler(requireControl(element, "config.typography.family"))({
      currentTarget: { value: "Custom Display" },
    });
    getChangeHandler(requireControl(element, "config.typography.size"))({
      currentTarget: { value: "18", valueAsNumber: 18 },
    });

    expect(changes).toEqual([
      { ...block, config: { level: 2, typography: { family: "Custom Display" } } },
      { ...block, config: { level: 2, typography: { size: 18 } } },
    ]);

    const clearChanges: Block[] = [];
    const clearElement = TypographyControls({
      target: "block",
      block: {
        ...block,
        config: { level: 2, typography: { family: "Inter" } },
      },
      metadata,
      onChangeBlock: (nextBlock) => clearChanges.push(nextBlock),
    });

    getChangeHandler(requireControl(clearElement, "config.typography.family"))({
      currentTarget: { value: "" },
    });

    expect(clearChanges).toEqual([block]);
  });

  it("updates template typography through template config", () => {
    const changes: Template[] = [];
    const template = { version: 1 } satisfies Template;
    const element = TypographyControls({
      target: "template",
      template,
      metadata,
      onChangeTemplate: (nextTemplate) => changes.push(nextTemplate),
    });

    getChangeHandler(requireControl(element, "template.config.typography.align"))({
      currentTarget: { value: "right" },
    });

    expect(changes).toEqual([
      {
        version: 1,
        config: {
          typography: {
            align: "right",
          },
        },
      },
    ]);
  });

  it("renders bundled font options when metadata is passed", () => {
    const html = renderToStaticMarkup(
      <TypographyControls
        target="template"
        template={{ version: 1 }}
        metadata={metadata}
        onChangeTemplate={() => undefined}
      />,
    );

    expect(html).toContain("<datalist");
    expect(html).toContain('value="Inter"');
    expect(html).toContain('value="Source Sans 3"');
  });
});

type TestElement = ReactElement<Record<string, unknown>>;

function requireControl(node: ReactNode, name: string): TestElement {
  const control = findElement(
    node,
    (element) =>
      isNativeElement(element) &&
      (element.props.name === name || element.props["data-name"] === name),
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

  if (typeof node.type === "function") {
    const renderComponent = node.type as (props: Record<string, unknown>) => ReactNode;
    const match = findElement(renderComponent(node.props), predicate);

    if (match) {
      return match;
    }
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

function isNativeElement(element: TestElement): boolean {
  return typeof element.type === "string";
}
