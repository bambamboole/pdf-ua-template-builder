import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Orientation, PageFormat, Template } from "../../types/generated/template";
import type { TemplateSchemaMetadata } from "../../types/template";
import { DocumentSettingsInspector } from "./DocumentSettingsInspector";

const metadata = {
  kind: "template",
  templateVersion: 1,
  renderEndpoint: "/render/template",
  templateFields: ["version", "config", "rows"],
  attachmentFields: [],
  externalFontFields: [],
  bundledFonts: ["Inter", "Source Sans 3"],
  blockOrder: ["heading", "text"],
  pageFormats: [{ name: "A4", widthMm: 210, heightMm: 297 }],
} satisfies TemplateSchemaMetadata;

describe("DocumentSettingsInspector", () => {
  it("renders document-scoped settings instead of selected-block copy", () => {
    const html = renderToStaticMarkup(
      <DocumentSettingsInspector
        template={{ version: 1 }}
        metadata={metadata}
        format="A4"
        orientation="portrait"
        footerRepeat
        pageNumbers="disabled"
        onChangeTemplate={() => undefined}
        onChangeFormat={() => undefined}
        onChangeOrientation={() => undefined}
        onToggleFooterRepeat={() => undefined}
        onChangePageNumbers={() => undefined}
      />,
    );

    expect(html).toContain('aria-label="Document settings inspector"');
    expect(html).toContain("Document settings");
    expect(html).toContain("Changes apply to the whole template.");
    expect(html).toContain("Page setup");
    expect(html).toContain("Page margins");
    expect(html).toContain("Footer");
    expect(html).toContain("Template typography");
    expect(html).not.toContain("Select a block to inspect it.");
  });

  it("updates template typography defaults", () => {
    const changes: Template[] = [];
    const element = DocumentSettingsInspector({
      template: { version: 1 },
      metadata,
      format: "A4",
      orientation: "portrait",
      footerRepeat: true,
      pageNumbers: "disabled",
      onChangeTemplate: (template) => changes.push(template),
      onChangeFormat: () => undefined,
      onChangeOrientation: () => undefined,
      onToggleFooterRepeat: () => undefined,
      onChangePageNumbers: () => undefined,
    });

    getChangeHandler(requireControl(element, "template.config.typography.family"))({
      currentTarget: { value: "Source Sans 3" },
    });

    expect(changes).toEqual([
      {
        version: 1,
        config: { typography: { family: "Source Sans 3" } },
      },
    ]);
  });

  it("updates page margins while preserving footer rows and page numbers", () => {
    const template = {
      version: 1,
      config: {
        page: {
          pageNumbers: { enabled: true, position: "right" },
          footer: {
            repeat: false,
            rows: [{ blocks: [{ type: "text", id: "footer", text: "Footer" }] }],
          },
        },
      },
    } satisfies Template;
    const changes: Template[] = [];
    const element = DocumentSettingsInspector({
      template,
      metadata,
      format: "A4",
      orientation: "portrait",
      footerRepeat: false,
      pageNumbers: "right",
      onChangeTemplate: (nextTemplate) => changes.push(nextTemplate),
      onChangeFormat: () => undefined,
      onChangeOrientation: () => undefined,
      onToggleFooterRepeat: () => undefined,
      onChangePageNumbers: () => undefined,
    });

    getNumberChangeHandler(requireControl(element, "config.page.margins.left"))({
      currentTarget: { value: "18", valueAsNumber: 18 },
    });

    expect(changes).toEqual([
      {
        ...template,
        config: {
          page: {
            pageNumbers: { enabled: true, position: "right" },
            footer: {
              repeat: false,
              rows: [{ blocks: [{ type: "text", id: "footer", text: "Footer" }] }],
            },
            margins: { left: 18 },
          },
        },
      },
    ]);
  });

  it("keeps page size and footer controls on document-level handlers", () => {
    const onChangeFormat = vi.fn<(format: PageFormat) => void>();
    const onChangeOrientation = vi.fn<(orientation: Orientation) => void>();
    const onToggleFooterRepeat = vi.fn<(repeat: boolean) => void>();
    const onChangePageNumbers = vi.fn<(value: "disabled" | "left" | "center" | "right") => void>();
    const element = DocumentSettingsInspector({
      template: { version: 1 },
      metadata,
      format: "A4",
      orientation: "portrait",
      footerRepeat: true,
      pageNumbers: "disabled",
      onChangeTemplate: () => undefined,
      onChangeFormat,
      onChangeOrientation,
      onToggleFooterRepeat,
      onChangePageNumbers,
    });

    getSelectChangeHandler(requireControl(element, "document.page.size.format"))({
      currentTarget: { value: "A5" },
    });
    getSelectChangeHandler(requireControl(element, "document.page.size.orientation"))({
      currentTarget: { value: "landscape" },
    });
    getCheckboxChangeHandler(requireControl(element, "document.page.footer.repeat"))({
      currentTarget: { checked: false },
    });
    getSelectChangeHandler(requireControl(element, "document.page.pageNumbers"))({
      currentTarget: { value: "center" },
    });

    expect(onChangeFormat).toHaveBeenCalledWith("A5");
    expect(onChangeOrientation).toHaveBeenCalledWith("landscape");
    expect(onToggleFooterRepeat).toHaveBeenCalledWith(false);
    expect(onChangePageNumbers).toHaveBeenCalledWith("center");
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

function getNumberChangeHandler(
  element: TestElement,
): (event: { currentTarget: { value: string; valueAsNumber: number } }) => void {
  const onChange = element.props.onChange;

  if (typeof onChange !== "function") {
    throw new Error("Control has no change handler");
  }

  return onChange as (event: { currentTarget: { value: string; valueAsNumber: number } }) => void;
}

function getSelectChangeHandler(
  element: TestElement,
): (event: { currentTarget: { value: string } }) => void {
  const onChange = element.props.onChange;

  if (typeof onChange !== "function") {
    throw new Error("Control has no change handler");
  }

  return onChange as (event: { currentTarget: { value: string } }) => void;
}

function getCheckboxChangeHandler(
  element: TestElement,
): (event: { currentTarget: { checked: boolean } }) => void {
  const onChange = element.props.onChange;

  if (typeof onChange !== "function") {
    throw new Error("Control has no change handler");
  }

  return onChange as (event: { currentTarget: { checked: boolean } }) => void;
}

function isReactElement(node: ReactNode): node is TestElement {
  return typeof node === "object" && node !== null && "props" in node;
}

function isNativeElement(element: TestElement): boolean {
  return typeof element.type === "string";
}
