import { describe, expect, it } from "vitest";
import type { BarcodeBlock } from "../../types/generated/template";
import {
  createBarcodeContent,
  describeBarcodeContent,
  isBarcodeCompatible,
  withBarcodeContentType,
  withBarcodeSymbology,
} from "./barcode";

describe("barcode helpers", () => {
  it("captures symbology/content compatibility rules", () => {
    expect(isBarcodeCompatible("qr", "wifi")).toBe(true);
    expect(isBarcodeCompatible("datamatrix", "url")).toBe(true);
    expect(isBarcodeCompatible("code128", "url")).toBe(false);
    expect(isBarcodeCompatible("gs1-128", "gs1")).toBe(true);
    expect(isBarcodeCompatible("gs1-databar", "gs1")).toBe(false);
    expect(isBarcodeCompatible("swiss-qr", "swiss")).toBe(true);
    expect(isBarcodeCompatible("swiss-qr", "url")).toBe(false);
  });

  it("coerces content when the selected symbology needs a specific payload", () => {
    const block: BarcodeBlock = {
      type: "barcode",
      symbology: "qr",
      content: { type: "url", url: "https://example.com" },
    };

    expect(withBarcodeSymbology(block, "gs1-128")).toMatchObject({
      symbology: "gs1-128",
      content: { type: "gs1" },
    });
    expect(withBarcodeSymbology(block, "swiss-qr")).toMatchObject({
      symbology: "swiss-qr",
      height: "46mm",
      content: { type: "swiss" },
    });
  });

  it("chooses a compatible symbology when the content type changes", () => {
    const block: BarcodeBlock = {
      type: "barcode",
      symbology: "code128",
      content: { type: "raw", value: "ABC123" },
    };

    expect(withBarcodeContentType(block, "text")).toMatchObject({
      symbology: "qr",
      content: { type: "text" },
    });
    expect(withBarcodeContentType(block, "swiss")).toMatchObject({
      symbology: "swiss-qr",
      height: "46mm",
      content: { type: "swiss" },
    });
  });

  it("summarizes content for canvas cards", () => {
    expect(describeBarcodeContent(createBarcodeContent("url"))).toBe("https://example.com");
    expect(
      describeBarcodeContent({ type: "gs1", elements: [{ ai: "01", value: "09521234543213" }] }),
    ).toBe("(01) 09521234543213");
  });
});
