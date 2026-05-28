import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CheckboxField,
  ColorField,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
  UnitField,
} from "./BuilderField";

describe("builder form controls", () => {
  it("server-renders shared label, help, and error layout", () => {
    const html = renderToStaticMarkup(
      <TextField
        name="block.text"
        label="Heading text"
        value="Invoice"
        help="Shown in the PDF"
        error="Required"
        onChange={() => undefined}
      />,
    );

    expect(html).toContain('for="builder-field-block-text"');
    expect(html).toContain('id="builder-field-block-text"');
    expect(html).toContain("Heading text");
    expect(html).toContain('name="block.text"');
    expect(html).toContain('value="Invoice"');
    expect(html).toContain("Shown in the PDF");
    expect(html).toContain("Required");
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain("aria-describedby");
  });

  it("preserves empty text values by default and can clear optional text to undefined", () => {
    const preserved: Array<string | undefined> = [];
    const preservedElement = TextField({
      name: "text",
      label: "Text",
      value: "Body",
      onChange: (value) => preserved.push(value),
    });

    getInputChangeHandler(requireControl(preservedElement, "text"))({
      currentTarget: { value: "" },
    });

    const cleared: Array<string | undefined> = [];
    const clearedElement = TextField({
      name: "config.width",
      label: "Width",
      value: "50%",
      emptyValue: "undefined",
      onChange: (value) => cleared.push(value),
    });

    getInputChangeHandler(requireControl(clearedElement, "config.width"))({
      currentTarget: { value: "" },
    });

    expect(preserved).toEqual([""]);
    expect(cleared).toEqual([undefined]);
  });

  it("renders textarea controls and applies the same optional empty text handling", () => {
    const changes: Array<string | undefined> = [];
    const element = TextAreaField({
      name: "description",
      label: "Description",
      value: "Initial",
      emptyValue: "undefined",
      onChange: (value) => changes.push(value),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("<textarea");
    expect(html).toContain('name="description"');

    getInputChangeHandler(requireControl(element, "description"))({
      currentTarget: { value: "" },
    });

    expect(changes).toEqual([undefined]);
  });

  it("converts number input values and clears empty numbers to undefined", () => {
    const changes: Array<number | undefined> = [];
    const element = NumberField({
      name: "config.maxHeight",
      label: "Max height",
      value: 28,
      min: 0,
      step: 0.5,
      onChange: (value) => changes.push(value),
    });
    const control = requireControl(element, "config.maxHeight");

    getInputChangeHandler(control)({
      currentTarget: { value: "42.5", valueAsNumber: 42.5 },
    });
    getInputChangeHandler(control)({
      currentTarget: { value: "", valueAsNumber: Number.NaN },
    });

    expect(changes).toEqual([42.5, undefined]);
  });

  it("renders optional selects with an empty option and clears empty selections", () => {
    const changes: Array<"left" | "center" | undefined> = [];
    const element = SelectField({
      name: "config.align",
      label: "Align",
      value: "center",
      optional: true,
      options: [
        { value: "left", label: "Left" },
        { value: "center", label: "Center" },
      ] as const,
      onChange: (value) => changes.push(value),
    });
    const html = renderToStaticMarkup(element);
    const control = requireControl(element, "config.align");

    expect(html).toContain('<option value=""></option>');
    expect(html).toContain('value="center" selected=""');

    getInputChangeHandler(control)({ currentTarget: { value: "" } });
    getInputChangeHandler(control)({ currentTarget: { value: "left" } });

    expect(changes).toEqual([undefined, "left"]);
  });

  it("renders an accessible controlled checkbox", () => {
    const changes: boolean[] = [];
    const element = CheckboxField({
      name: "config.repeat",
      label: "Repeat footer",
      checked: false,
      onChange: (checked) => changes.push(checked),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('type="checkbox"');
    expect(html).toContain('name="config.repeat"');
    expect(html).toContain("Repeat footer");
    expect(html).not.toContain("checked");

    getCheckboxChangeHandler(requireControl(element, "config.repeat"))({
      currentTarget: { checked: true },
    });

    expect(changes).toEqual([true]);
  });

  it("renders color and CSS unit fields as controlled typed inputs", () => {
    const colors: Array<string | undefined> = [];
    const colorElement = ColorField({
      name: "config.color",
      label: "Color",
      value: "#334455",
      onChange: (value) => colors.push(value),
    });
    const widths: Array<string | undefined> = [];
    const unitElement = UnitField({
      name: "config.width",
      label: "Width",
      value: "80mm",
      onChange: (value) => widths.push(value),
    });

    expect(renderToStaticMarkup(colorElement)).toContain('type="color"');
    expect(renderToStaticMarkup(unitElement)).toContain('inputMode="text"');

    getInputChangeHandler(requireControl(colorElement, "config.color"))({
      currentTarget: { value: "#112233" },
    });
    getInputChangeHandler(requireControl(unitElement, "config.width"))({
      currentTarget: { value: "auto" },
    });
    getInputChangeHandler(requireControl(unitElement, "config.width"))({
      currentTarget: { value: "" },
    });

    expect(colors).toEqual(["#112233"]);
    expect(widths).toEqual(["auto", undefined]);
  });
});

type TestElement = ReactElement<Record<string, unknown>>;

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
    throw new Error("Control has no change handler");
  }

  return onChange as (event: { currentTarget: { value: string; valueAsNumber?: number } }) => void;
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
