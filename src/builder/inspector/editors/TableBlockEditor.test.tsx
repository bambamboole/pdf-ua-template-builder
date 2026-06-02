import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TableBlock } from "../../../types/generated/template";
import {
  TableBlockEditor,
  addColumn,
  addRow,
  moveColumn,
  moveRow,
  removeColumn,
  removeRow,
  renameColumnKey,
  renameColumnKeyInRows,
  setCellValue,
  setColumnAlign,
  setColumnLabel,
  setTableNumberRows,
} from "./TableBlockEditor";

const baseBlock = {
  type: "table",
  id: "lineItems",
  style: "striped",
  columns: [
    { key: "description", label: "Description", align: "left" },
    { key: "quantity", label: "Qty", align: "right" },
  ],
} satisfies TableBlock;

const baseRows = [
  { description: "Service A", quantity: "2" },
  { description: "Service B", quantity: "5" },
];

describe("TableBlockEditor render", () => {
  it("renders one column row per defined column with key/label/align inputs", () => {
    render(<TableBlockEditor block={baseBlock} onChangeBlock={() => undefined} />);

    const keyInputs = screen.getAllByLabelText("Key");
    const labelInputs = screen.getAllByLabelText("Label");

    expect(keyInputs).toHaveLength(2);
    expect(keyInputs[0]).toHaveValue("description");
    expect(keyInputs[1]).toHaveValue("quantity");

    expect(labelInputs).toHaveLength(2);
    expect(labelInputs[0]).toHaveValue("Description");
    expect(labelInputs[1]).toHaveValue("Qty");
  });

  it("renders drag handles and ✕ remove buttons per column row", () => {
    render(<TableBlockEditor block={baseBlock} onChangeBlock={() => undefined} />);

    expect(screen.getByRole("button", { name: "Drag to reorder column 1" })).toBeInTheDocument();
    const removeButton = screen.getByRole("button", { name: "Remove column 1" });
    expect(removeButton).toBeInTheDocument();
    expect(removeButton).toHaveTextContent("✕");
  });

  it("renders sample data rows when rowData is provided and the block has an id", () => {
    render(
      <TableBlockEditor
        block={baseBlock}
        rowData={baseRows}
        onChangeBlock={() => undefined}
        onChangeRowData={() => undefined}
      />,
    );

    const descriptionCells = screen.getAllByLabelText("Description");
    const qtyCells = screen.getAllByLabelText("Qty");

    expect(descriptionCells[0]).toHaveValue("Service A");
    expect(qtyCells[0]).toHaveValue("2");
    expect(descriptionCells[1]).toHaveValue("Service B");
    expect(screen.getByRole("button", { name: "Drag to reorder row 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove row 1" })).toBeInTheDocument();
  });

  it("shows a notice when the block has no id and the row editor cannot persist data", () => {
    const noIdBlock = { type: "table" } satisfies TableBlock;
    render(<TableBlockEditor block={noIdBlock} onChangeBlock={() => undefined} />);

    expect(screen.getByText(/Give this block an id/)).toBeInTheDocument();
  });
});

describe("TableBlockEditor column helpers", () => {
  it("moveColumn returns a reordered array", () => {
    const columns = [
      { key: "a", label: "A" },
      { key: "b", label: "B" },
      { key: "c", label: "C" },
    ];

    expect(moveColumn(columns, 0, 2)).toEqual([
      { key: "b", label: "B" },
      { key: "c", label: "C" },
      { key: "a", label: "A" },
    ]);
  });

  it("addColumn appends with a sensible default key", () => {
    const next = addColumn(baseBlock);

    expect(next.columns).toEqual([
      { key: "description", label: "Description", align: "left" },
      { key: "quantity", label: "Qty", align: "right" },
      { key: "column3", label: "Column 3" },
    ]);
  });

  it("removeColumn drops the column from the block", () => {
    const next = removeColumn(baseBlock, 1);

    expect(next.columns).toEqual([{ key: "description", label: "Description", align: "left" }]);
  });

  it("renameColumnKey updates only the key field on the block", () => {
    const next = renameColumnKey(baseBlock, 0, "item");

    expect(next.columns?.[0]).toEqual({ key: "item", label: "Description", align: "left" });
  });

  it("rejects renaming a column key onto another column's key", () => {
    const next = renameColumnKey(baseBlock, 0, "quantity");

    expect(next).toBe(baseBlock);
  });

  it("renameColumnKeyInRows renames the matching key in every data row", () => {
    expect(renameColumnKeyInRows(baseRows, "description", "item")).toEqual([
      { item: "Service A", quantity: "2" },
      { item: "Service B", quantity: "5" },
    ]);
  });

  it("setColumnLabel updates only the label", () => {
    const next = setColumnLabel(baseBlock, 0, "Item");

    expect(next.columns?.[0]).toEqual({ key: "description", label: "Item", align: "left" });
  });

  it("setColumnAlign clears the field when empty string is passed", () => {
    const next = setColumnAlign(baseBlock, 0, "");

    expect(next.columns?.[0]).toEqual({ key: "description", label: "Description" });
  });

  it("reserves 5% from the first column when enabling row numbers", () => {
    const block = {
      type: "table",
      id: "t",
      columns: [
        { key: "a", label: "A", width: "60%" },
        { key: "b", label: "B", width: "40%" },
      ],
    } satisfies TableBlock;

    const enabled = setTableNumberRows(block, true);
    expect(enabled.numberRows).toBe(true);
    expect(enabled.columns).toEqual([
      { key: "a", label: "A", width: "55%" },
      { key: "b", label: "B", width: "40%" },
    ]);

    const disabled = setTableNumberRows(enabled, undefined);
    expect(disabled.numberRows).toBeUndefined();
    expect(disabled.columns).toEqual([
      { key: "a", label: "A", width: "60%" },
      { key: "b", label: "B", width: "40%" },
    ]);
  });

  it("leaves columns untouched when widths are not all percentages", () => {
    const block = {
      type: "table",
      id: "t",
      columns: [
        { key: "a", label: "A" },
        { key: "b", label: "B" },
      ],
    } satisfies TableBlock;

    const enabled = setTableNumberRows(block, true);
    expect(enabled.numberRows).toBe(true);
    expect(enabled.columns).toEqual([
      { key: "a", label: "A" },
      { key: "b", label: "B" },
    ]);
  });
});

describe("TableBlockEditor row helpers", () => {
  it("moveRow returns a reordered array", () => {
    expect(moveRow(baseRows, 0, 1)).toEqual([
      { description: "Service B", quantity: "5" },
      { description: "Service A", quantity: "2" },
    ]);
  });

  it("addRow appends an empty row keyed by the columns", () => {
    expect(addRow(baseRows, baseBlock.columns)).toEqual([
      ...baseRows,
      { description: "", quantity: "" },
    ]);
  });

  it("removeRow drops a single row", () => {
    expect(removeRow(baseRows, 0)).toEqual([{ description: "Service B", quantity: "5" }]);
  });

  it("setCellValue updates one cell in one row", () => {
    expect(setCellValue(baseRows, 1, "quantity", "9")).toEqual([
      { description: "Service A", quantity: "2" },
      { description: "Service B", quantity: "9" },
    ]);
  });
});
