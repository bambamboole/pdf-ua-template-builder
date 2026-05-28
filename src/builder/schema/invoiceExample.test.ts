import { describe, expect, it } from "vitest";
import type {
  HeadingBlock,
  ImageBlock,
  KeyValueBlock,
  PresetPageSize,
  TableBlock,
  TextBlock,
} from "../../types/generated/template";
import type { Block } from "../../types/generated/template";
import { createInvoiceExample } from "./invoiceExample";

function findBlock<T>(
  template: ReturnType<typeof createInvoiceExample>["template"],
  blockId: string,
): T {
  for (const row of template.rows ?? []) {
    for (const block of row.blocks) {
      if (block.id === blockId) {
        return block as T;
      }
    }
  }
  throw new Error(`Block ${blockId} not found in invoice example`);
}

describe("createInvoiceExample", () => {
  it("returns a German A4 portrait template with margins and page numbers", () => {
    const { template } = createInvoiceExample();
    const page = template.config?.page;
    const size = page?.size as PresetPageSize | undefined;

    expect(size?.format).toBe("A4");
    expect(size?.orientation).toBe("portrait");
    expect(page?.locale).toBe("de_DE");
    expect(page?.margins).toEqual({ top: 20, right: 20, bottom: 20, left: 25 });
    expect(page?.pageNumbers).toEqual({ enabled: true, position: "center" });
  });

  it("includes a logo image with width and max height constraints", () => {
    const { template } = createInvoiceExample();
    const logo = findBlock<ImageBlock>(template, "logo");

    expect(logo.type).toBe("image");
    expect(logo.alt).toBe("PDF UA Kit GmbH logo");
    expect(logo.src.startsWith("data:image/svg+xml;base64,")).toBe(true);
    expect(logo.config?.width).toBe("58%");
    expect(logo.config?.maxHeight).toBe(28);
  });

  it("embeds invoice metadata as a right-aligned key-value block", () => {
    const { template } = createInvoiceExample();
    const meta = findBlock<KeyValueBlock>(template, "invoice-meta");

    expect(meta.values?.invoiceNumber).toBe("RE-2026-001234");
    expect(meta.config?.align).toBe("right");
    expect(meta.config?.fields?.map((field) => field.key)).toEqual([
      "invoiceNumber",
      "issueDate",
      "dueDate",
      "currency",
    ]);
  });

  it("renders the title as a level-1 heading", () => {
    const { template } = createInvoiceExample();
    const title = findBlock<HeadingBlock>(template, "title");

    expect(title.text).toBe("Invoice");
    expect(title.config?.level).toBe(1);
  });

  it("describes seller and buyer as two equal-width key-value blocks", () => {
    const { template } = createInvoiceExample();
    const seller = findBlock<KeyValueBlock>(template, "seller");
    const buyer = findBlock<KeyValueBlock>(template, "buyer");

    expect(seller.config?.width).toBe("50%");
    expect(buyer.config?.width).toBe("50%");
    expect(seller.values?.vatId).toBe("DE123456789");
    expect(buyer.values?.name).toBe("Musterkunde AG");
  });

  it("defines a striped numbered line-items table with five columns", () => {
    const { template } = createInvoiceExample();
    const lineItems = findBlock<TableBlock>(template, "lineItems");

    expect(lineItems.config?.style).toBe("striped");
    expect(lineItems.config?.numberRows).toBe(true);
    expect(lineItems.config?.columns?.map((column) => column.key)).toEqual([
      "description",
      "quantity",
      "unitPrice",
      "vatRate",
      "total",
    ]);
  });

  it("provides runtime row data for both tables, keyed by block id", () => {
    const { data } = createInvoiceExample();
    const lineItems = data.lineItems as unknown[];
    const vatBreakdown = data["vat-breakdown"] as unknown[];

    expect(Array.isArray(lineItems)).toBe(true);
    expect(lineItems).toHaveLength(4);
    expect(Array.isArray(vatBreakdown)).toBe(true);
    expect(vatBreakdown).toHaveLength(1);
  });

  it("repeats a footer with legal text + meta key-value", () => {
    const { template } = createInvoiceExample();
    const footer = template.config?.page?.footer;
    const blocks = (footer?.rows?.[0]?.blocks ?? []) as Block[];
    const legal = blocks.find((block): block is TextBlock => block.id === "footer-legal");
    const meta = blocks.find((block): block is KeyValueBlock => block.id === "footer-meta");

    expect(footer?.repeat).toBe(true);
    expect(legal?.text.startsWith("PDF UA Kit GmbH")).toBe(true);
    expect(meta?.values?.registration).toBe("HRB 123456 B");
  });

  it("enables center page numbers", () => {
    const { template } = createInvoiceExample();

    expect(template.config?.page?.pageNumbers).toEqual({ enabled: true, position: "center" });
  });

  it("ships totals, notice and payment with static values", () => {
    const { template } = createInvoiceExample();
    const totals = findBlock<KeyValueBlock>(template, "totals");
    const notice = findBlock<TextBlock>(template, "notice");
    const payment = findBlock<KeyValueBlock>(template, "payment");

    expect(totals.values?.grandTotal).toBe("7.282,80 €");
    expect(notice.text.startsWith("Please transfer")).toBe(true);
    expect(payment.values?.iban).toBe("DE89370400440532013000");
  });
});
