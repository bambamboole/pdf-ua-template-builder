import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { TableBlock } from "../../types/generated/template";
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
  config: {
    style: "striped",
    columns: [
      { key: "description", label: "Description", align: "left" },
      { key: "quantity", label: "Qty", align: "right" },
    ],
  },
} satisfies TableBlock;

const baseRows = [
  { description: "Service A", quantity: "2" },
  { description: "Service B", quantity: "5" },
];

describe("TableBlockEditor render", () => {
  it("renders one column row per defined column with key/label/align inputs", () => {
    const html = renderToStaticMarkup(
      <TableBlockEditor block={baseBlock} onChangeBlock={() => undefined} />,
    );

    expect(html).toContain("Description");
    expect(html).toContain("Qty");
    expect(html).toContain('value="description"');
    expect(html).toContain('value="quantity"');
  });

  it("renders drag handles and ✕ remove buttons per column row", () => {
    const html = renderToStaticMarkup(
      <TableBlockEditor block={baseBlock} onChangeBlock={() => undefined} />,
    );

    expect(html).toContain('aria-label="Drag to reorder column 1"');
    expect(html).toContain('aria-label="Remove column 1"');
    expect(html).toContain("✕");
  });

  it("renders sample data rows when rowData is provided and the block has an id", () => {
    const html = renderToStaticMarkup(
      <TableBlockEditor
        block={baseBlock}
        rowData={baseRows}
        onChangeBlock={() => undefined}
        onChangeRowData={() => undefined}
      />,
    );

    expect(html).toContain('value="Service A"');
    expect(html).toContain('value="2"');
    expect(html).toContain('value="Service B"');
    expect(html).toContain('aria-label="Drag to reorder row 1"');
    expect(html).toContain('aria-label="Remove row 1"');
  });

  it("shows a notice when the block has no id and the row editor cannot persist data", () => {
    const noIdBlock = { type: "table" } satisfies TableBlock;
    const html = renderToStaticMarkup(
      <TableBlockEditor block={noIdBlock} onChangeBlock={() => undefined} />,
    );

    expect(html).toContain("Give this block an id");
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

    expect(next.config?.columns).toEqual([
      { key: "description", label: "Description", align: "left" },
      { key: "quantity", label: "Qty", align: "right" },
      { key: "column3", label: "Column 3" },
    ]);
  });

  it("removeColumn drops the column from the block", () => {
    const next = removeColumn(baseBlock, 1);

    expect(next.config?.columns).toEqual([
      { key: "description", label: "Description", align: "left" },
    ]);
  });

  it("renameColumnKey updates only the key field on the block", () => {
    const next = renameColumnKey(baseBlock, 0, "item");

    expect(next.config?.columns?.[0]).toEqual({ key: "item", label: "Description", align: "left" });
  });

  it("renameColumnKeyInRows renames the matching key in every data row", () => {
    expect(renameColumnKeyInRows(baseRows, "description", "item")).toEqual([
      { item: "Service A", quantity: "2" },
      { item: "Service B", quantity: "5" },
    ]);
  });

  it("setColumnLabel updates only the label", () => {
    const next = setColumnLabel(baseBlock, 0, "Item");

    expect(next.config?.columns?.[0]).toEqual({ key: "description", label: "Item", align: "left" });
  });

  it("setColumnAlign clears the field when empty string is passed", () => {
    const next = setColumnAlign(baseBlock, 0, "");

    expect(next.config?.columns?.[0]).toEqual({ key: "description", label: "Description" });
  });

  it("reserves 5% from the first column when enabling row numbers", () => {
    const block = {
      type: "table",
      id: "t",
      config: {
        columns: [
          { key: "a", label: "A", width: "60%" },
          { key: "b", label: "B", width: "40%" },
        ],
      },
    } satisfies TableBlock;

    const enabled = setTableNumberRows(block, true);
    expect(enabled.config?.numberRows).toBe(true);
    expect(enabled.config?.columns).toEqual([
      { key: "a", label: "A", width: "55%" },
      { key: "b", label: "B", width: "40%" },
    ]);

    const disabled = setTableNumberRows(enabled, undefined);
    expect(disabled.config?.numberRows).toBeUndefined();
    expect(disabled.config?.columns).toEqual([
      { key: "a", label: "A", width: "60%" },
      { key: "b", label: "B", width: "40%" },
    ]);
  });

  it("leaves columns untouched when widths are not all percentages", () => {
    const block = {
      type: "table",
      id: "t",
      config: {
        columns: [
          { key: "a", label: "A" },
          { key: "b", label: "B" },
        ],
      },
    } satisfies TableBlock;

    const enabled = setTableNumberRows(block, true);
    expect(enabled.config?.numberRows).toBe(true);
    expect(enabled.config?.columns).toEqual([
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
    expect(addRow(baseRows, baseBlock.config.columns)).toEqual([
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
