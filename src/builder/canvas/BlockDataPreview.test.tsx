import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Block } from "../../types/generated/template";
import { BlockDataPreview } from "./BlockDataPreview";

describe("BlockDataPreview", () => {
  it("renders text and heading content directly on the card", () => {
    const block: Block = { type: "text", id: "notice", text: "Payment is due in 30 days." };

    render(<BlockDataPreview block={block} />);

    expect(screen.getByText("Payment is due in 30 days.")).toBeInTheDocument();
  });

  it("renders image content directly on the card", () => {
    const block: Block = {
      type: "image",
      id: "logo",
      src: "data:image/svg+xml;base64,PHN2Zy8+",
      alt: "PDF UA Kit logo",
    };

    render(<BlockDataPreview block={block} />);

    const image = screen.getByRole("img", { name: "PDF UA Kit logo" });
    expect(image).toHaveAttribute("src", "data:image/svg+xml;base64,PHN2Zy8+");
    expect(image).toHaveAttribute("alt", "PDF UA Kit logo");
  });

  it("renders key-value labels and values directly on the card", () => {
    const block: Block = {
      type: "key-value",
      id: "invoice-meta",
      values: { invoiceNumber: "RE-2026-001234" },
      fields: [{ key: "invoiceNumber", label: "Invoice number" }],
    };

    render(<BlockDataPreview block={block} />);

    expect(screen.getByText("Invoice number")).toBeInTheDocument();
    expect(screen.getByText("RE-2026-001234")).toBeInTheDocument();
  });

  it("reflects labelWidth and exposes the label resizer when editable", () => {
    const block: Block = {
      type: "key-value",
      id: "invoice-meta",
      values: { invoiceNumber: "RE-2026-001234" },
      labelWidth: "40%",
      fields: [{ key: "invoiceNumber", label: "Invoice number" }],
    };

    render(<BlockDataPreview block={block} onChange={() => {}} />);

    expect(screen.getByText("Invoice number").parentElement).toHaveStyle({
      gridTemplateColumns: "40% minmax(0, 1fr)",
    });
    expect(screen.getByRole("button", { name: "Resize the label column" })).toBeInTheDocument();
  });

  it("omits the label resizer when no change handler is provided", () => {
    const block: Block = {
      type: "key-value",
      id: "invoice-meta",
      values: { invoiceNumber: "RE-2026-001234" },
      fields: [{ key: "invoiceNumber", label: "Invoice number" }],
    };

    render(<BlockDataPreview block={block} />);

    expect(
      screen.queryByRole("button", { name: "Resize the label column" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Invoice number").parentElement).toHaveStyle({
      gridTemplateColumns: "30% minmax(0, 1fr)",
    });
  });

  it("renders table headers and runtime rows directly on the card", () => {
    const block: Block = {
      type: "table",
      id: "lineItems",
      columns: [
        { key: "description", label: "Description" },
        { key: "total", label: "Total" },
      ],
    };

    render(
      <BlockDataPreview
        block={block}
        rowData={[{ description: "Accessible PDF template", total: "3.800,00 €" }]}
      />,
    );

    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Accessible PDF template")).toBeInTheDocument();
    expect(screen.getByText("3.800,00 €")).toBeInTheDocument();
  });

  it("adds a numbered column to the table preview when numberRows is enabled", () => {
    const block: Block = {
      type: "table",
      id: "lineItems",
      numberRows: true,
      columns: [{ key: "description", label: "Description" }],
    };

    render(
      <BlockDataPreview
        block={block}
        rowData={[{ description: "Row one" }, { description: "Row two" }]}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "#" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "2" })).toBeInTheDocument();
  });

  it("omits the numbered column when numberRows is not set", () => {
    const block: Block = {
      type: "table",
      id: "lineItems",
      columns: [{ key: "description", label: "Description" }],
    };

    render(<BlockDataPreview block={block} rowData={[{ description: "Row one" }]} />);

    expect(screen.queryByRole("columnheader", { name: "#" })).not.toBeInTheDocument();
  });

  it("overlays a column resizer at each interior boundary when editable", () => {
    const block: Block = {
      type: "table",
      id: "lineItems",
      columns: [
        { key: "description", label: "Description" },
        { key: "qty", label: "Qty" },
        { key: "total", label: "Total" },
      ],
    };

    const { container } = render(<BlockDataPreview block={block} onChange={() => {}} />);

    expect(container.querySelector("colgroup")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resize column 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resize column 2" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resize column 3" })).not.toBeInTheDocument();
  });

  it("omits table column resizers when the preview is read-only", () => {
    const block: Block = {
      type: "table",
      id: "lineItems",
      columns: [
        { key: "description", label: "Description" },
        { key: "qty", label: "Qty" },
      ],
    };

    render(<BlockDataPreview block={block} />);

    expect(screen.queryByRole("button", { name: /Resize column/ })).not.toBeInTheDocument();
  });
});
