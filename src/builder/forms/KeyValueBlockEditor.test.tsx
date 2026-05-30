import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { KeyValueBlock } from "../../types/generated/template";
import {
  KeyValueBlockEditor,
  addField,
  moveField,
  removeField,
  renameFieldKey,
  setFieldLabel,
  setValue,
} from "./KeyValueBlockEditor";

const baseBlock = {
  type: "key-value",
  id: "invoice-meta",
  values: {
    invoiceNumber: "RE-2026-001234",
    issueDate: "2026-02-17",
  },
  config: {
    fields: [
      { key: "invoiceNumber", label: "Invoice number" },
      { key: "issueDate", label: "Issue date" },
    ],
  },
} satisfies KeyValueBlock;

describe("KeyValueBlockEditor render", () => {
  it("renders one value input per declared field, using each field label", () => {
    render(<KeyValueBlockEditor block={baseBlock} onChangeBlock={() => undefined} />);

    const invoiceInput = screen.getByLabelText("Invoice number");
    const issueInput = screen.getByLabelText("Issue date");

    expect(invoiceInput).toHaveValue("RE-2026-001234");
    expect(issueInput).toHaveValue("2026-02-17");
    expect(invoiceInput).toHaveAttribute("name", "values.invoiceNumber");
    expect(issueInput).toHaveAttribute("name", "values.issueDate");
    expect(document.querySelector("textarea")).not.toBeInTheDocument();
  });

  it("renders a drag handle and a ✕ remove button per field row", () => {
    render(<KeyValueBlockEditor block={baseBlock} onChangeBlock={() => undefined} />);

    expect(screen.getByRole("button", { name: "Drag to reorder field 1" })).toBeInTheDocument();

    const removeButton = screen.getByRole("button", { name: "Remove field 1" });
    expect(removeButton).toBeInTheDocument();
    expect(removeButton).toHaveTextContent("✕");
  });
});

describe("KeyValueBlockEditor state helpers", () => {
  it("moveField returns a new array with the moved item", () => {
    const fields = [
      { key: "a", label: "A" },
      { key: "b", label: "B" },
      { key: "c", label: "C" },
    ];

    expect(moveField(fields, 0, 2)).toEqual([
      { key: "b", label: "B" },
      { key: "c", label: "C" },
      { key: "a", label: "A" },
    ]);
    expect(moveField(fields, 2, 0)).toEqual([
      { key: "c", label: "C" },
      { key: "a", label: "A" },
      { key: "b", label: "B" },
    ]);
    expect(moveField(fields, 1, 1)).toEqual(fields);
  });

  it("addField appends with a sensible default key", () => {
    const next = addField(baseBlock);

    expect(next).toEqual({
      ...baseBlock,
      config: {
        fields: [
          { key: "invoiceNumber", label: "Invoice number" },
          { key: "issueDate", label: "Issue date" },
          { key: "field3", label: "Field 3" },
        ],
      },
    });
  });

  it("addField creates the first field when the block has none", () => {
    const emptyBlock = { type: "key-value", id: "kv-empty" } satisfies KeyValueBlock;
    const next = addField(emptyBlock);

    expect(next).toEqual({
      type: "key-value",
      id: "kv-empty",
      config: {
        fields: [{ key: "field1", label: "Field 1" }],
      },
    });
  });

  it("removeField drops the matching value entry", () => {
    const next = removeField(baseBlock, 0);

    expect(next).toEqual({
      ...baseBlock,
      values: { issueDate: "2026-02-17" },
      config: {
        fields: [{ key: "issueDate", label: "Issue date" }],
      },
    });
  });

  it("renameFieldKey renames the matching value entry", () => {
    const next = renameFieldKey(baseBlock, 0, "invoiceNo");

    expect(next.values).toEqual({
      invoiceNo: "RE-2026-001234",
      issueDate: "2026-02-17",
    });
    expect(next.config?.fields?.[0]).toEqual({ key: "invoiceNo", label: "Invoice number" });
  });

  it("setFieldLabel updates only the label", () => {
    const next = setFieldLabel(baseBlock, 1, "Issued on");

    expect(next.config?.fields).toEqual([
      { key: "invoiceNumber", label: "Invoice number" },
      { key: "issueDate", label: "Issued on" },
    ]);
    expect(next.values).toEqual(baseBlock.values);
  });

  it("setValue updates the runtime value for a key", () => {
    const next = setValue(baseBlock, "invoiceNumber", "RE-2026-9999");

    expect(next.values).toEqual({
      invoiceNumber: "RE-2026-9999",
      issueDate: "2026-02-17",
    });
  });
});
