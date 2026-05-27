import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Block } from "../../types/generated/template";
import type { JsonSchemaObject } from "../schema/schemaAdapter";
import { InlineBlockForm } from "./InlineBlockForm";

const headingBlock = {
  type: "heading",
  text: "Title",
  config: {
    level: 2,
  },
} satisfies Block;

const fieldSchema = {
  type: "object",
  properties: {
    text: {
      type: "string",
      title: "Text",
    },
  },
} satisfies JsonSchemaObject;

const configSchema = {
  type: "object",
  properties: {
    width: {
      type: ["string", "null"],
      title: "Width",
    },
    level: {
      type: "number",
      title: "Level",
    },
  },
} satisfies JsonSchemaObject;

describe("InlineBlockForm", () => {
  it("server-renders schema-derived heading field and config controls", () => {
    const html = renderToStaticMarkup(
      <InlineBlockForm
        block={headingBlock}
        fieldSchema={fieldSchema}
        configSchema={configSchema}
        onChange={() => undefined}
      />,
    );

    expect(html).toContain("Text");
    expect(html).toContain("Width");
    expect(html).toContain("Level");
    expect(html).toContain("Title");
    expect(html).toContain('value="2"');
  });

  it("server-renders enum selects with an empty option and without null enum values", () => {
    const html = renderToStaticMarkup(
      <InlineBlockForm
        block={{ ...headingBlock, config: { align: "center" } }}
        fieldSchema={fieldSchema}
        configSchema={{
          type: "object",
          properties: {
            align: {
              title: "Align",
              enum: [null, "left", "center", "right"],
            },
          },
        }}
        onChange={() => undefined}
      />,
    );

    expect(html).toContain("<option");
    expect(html).toContain('value=""');
    expect(html).toContain('value="center" selected=""');
    expect(html).not.toContain('value="null"');
  });

  it("server-renders text and html string schemas as text inputs", () => {
    const html = renderToStaticMarkup(
      <InlineBlockForm
        block={{ type: "html", html: "<p>Body</p>" }}
        fieldSchema={{
          type: "object",
          properties: {
            html: {
              title: "HTML",
              type: "string",
            },
            text: {
              title: "Text",
              type: "string",
            },
          },
        }}
        onChange={() => undefined}
      />,
    );

    expect(html).toContain('name="html"');
    expect(html).toContain('name="text"');
    expect(html).toContain('type="text"');
    expect(html).not.toContain("<textarea");
  });

  it("updates top-level fields without changing type", () => {
    const changes: Block[] = [];
    const element = InlineBlockForm({
      block: headingBlock,
      fieldSchema,
      configSchema,
      onChange: (block) => changes.push(block),
    });
    const control = requireControl(element, "text");

    getChangeHandler(control)({ currentTarget: { value: "Updated title" } });

    expect(changes).toEqual([
      {
        type: "heading",
        text: "Updated title",
        config: {
          level: 2,
        },
      },
    ]);

    getChangeHandler(control)({ currentTarget: { value: "" } });

    expect(changes[1]).toEqual({
      type: "heading",
      text: "",
      config: {
        level: 2,
      },
    });
  });

  it("updates config fields and removes empty config values", () => {
    const changes: Block[] = [];
    const element = InlineBlockForm({
      block: { ...headingBlock, config: { level: 2, width: "60%" } },
      fieldSchema,
      configSchema,
      onChange: (block) => changes.push(block),
    });
    const control = requireControl(element, "config.width");

    getChangeHandler(control)({ currentTarget: { value: "" } });

    expect(changes).toEqual([
      {
        type: "heading",
        text: "Title",
        config: {
          level: 2,
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

function getChangeHandler(
  element: TestElement,
): (event: { currentTarget: { value: string } }) => void {
  const onChange = element.props.onChange;

  if (typeof onChange !== "function") {
    throw new Error("Control has no change handler");
  }

  return onChange as (event: { currentTarget: { value: string } }) => void;
}

function isReactElement(node: ReactNode): node is TestElement {
  return typeof node === "object" && node !== null && "props" in node;
}
