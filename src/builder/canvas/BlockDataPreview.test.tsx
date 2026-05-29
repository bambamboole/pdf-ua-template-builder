import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Block } from "../../types/generated/template";
import { BlockDataPreview } from "./BlockDataPreview";

describe("BlockDataPreview", () => {
  it("renders text and heading content directly on the card", () => {
    const block: Block = { type: "text", id: "notice", text: "Payment is due in 30 days." };

    const html = renderToStaticMarkup(<BlockDataPreview block={block} />);

    expect(html).toContain("Payment is due in 30 days.");
  });

  it("renders image content directly on the card", () => {
    const block: Block = {
      type: "image",
      id: "logo",
      src: "data:image/svg+xml;base64,PHN2Zy8+",
      alt: "PDF UA Kit logo",
    };

    const html = renderToStaticMarkup(<BlockDataPreview block={block} />);

    expect(html).toContain('src="data:image/svg+xml;base64,PHN2Zy8+"');
    expect(html).toContain('alt="PDF UA Kit logo"');
  });

  it("renders key-value labels and values directly on the card", () => {
    const block: Block = {
      type: "key-value",
      id: "invoice-meta",
      values: { invoiceNumber: "RE-2026-001234" },
      config: { fields: [{ key: "invoiceNumber", label: "Invoice number" }] },
    };

    const html = renderToStaticMarkup(<BlockDataPreview block={block} />);

    expect(html).toContain("Invoice number");
    expect(html).toContain("RE-2026-001234");
  });

  it("reflects labelWidth and exposes the label resizer when editable", () => {
    const block: Block = {
      type: "key-value",
      id: "invoice-meta",
      values: { invoiceNumber: "RE-2026-001234" },
      config: {
        labelWidth: "40%",
        fields: [{ key: "invoiceNumber", label: "Invoice number" }],
      },
    };

    const html = renderToStaticMarkup(<BlockDataPreview block={block} onChange={() => {}} />);

    expect(html).toContain("grid-template-columns:40% minmax(0, 1fr)");
    expect(html).toContain("Resize the label column");
  });

  it("omits the label resizer when no change handler is provided", () => {
    const block: Block = {
      type: "key-value",
      id: "invoice-meta",
      values: { invoiceNumber: "RE-2026-001234" },
      config: { fields: [{ key: "invoiceNumber", label: "Invoice number" }] },
    };

    const html = renderToStaticMarkup(<BlockDataPreview block={block} />);

    expect(html).not.toContain("Resize the label column");
    expect(html).toContain("grid-template-columns:30% minmax(0, 1fr)");
  });

  it("renders table headers and runtime rows directly on the card", () => {
    const block: Block = {
      type: "table",
      id: "lineItems",
      config: {
        columns: [
          { key: "description", label: "Description" },
          { key: "total", label: "Total" },
        ],
      },
    };

    const html = renderToStaticMarkup(
      <BlockDataPreview
        block={block}
        rowData={[{ description: "Accessible PDF template", total: "3.800,00 €" }]}
      />,
    );

    expect(html).toContain("Description");
    expect(html).toContain("Accessible PDF template");
    expect(html).toContain("3.800,00 €");
  });

  it("adds a numbered column to the table preview when numberRows is enabled", () => {
    const block: Block = {
      type: "table",
      id: "lineItems",
      config: { numberRows: true, columns: [{ key: "description", label: "Description" }] },
    };

    const html = renderToStaticMarkup(
      <BlockDataPreview block={block} rowData={[{ description: "Row one" }, { description: "Row two" }]} />,
    );

    expect(html).toContain(">#<");
    expect(html).toContain(">1<");
    expect(html).toContain(">2<");
  });

  it("omits the numbered column when numberRows is not set", () => {
    const block: Block = {
      type: "table",
      id: "lineItems",
      config: { columns: [{ key: "description", label: "Description" }] },
    };

    const html = renderToStaticMarkup(
      <BlockDataPreview block={block} rowData={[{ description: "Row one" }]} />,
    );

    expect(html).not.toContain(">#<");
  });
});
