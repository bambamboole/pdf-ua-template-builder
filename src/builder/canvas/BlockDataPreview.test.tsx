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
});
