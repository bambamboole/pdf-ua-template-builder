import { describe, expect, it } from "vitest";
import { PAGE_SIZES_MM, pageSizeForFormat } from "./pageSizes";

describe("pageSizeForFormat", () => {
  it("returns the portrait dimensions for a known format", () => {
    expect(pageSizeForFormat("A4")).toEqual([210, 297]);
    expect(pageSizeForFormat("Letter")).toEqual([215.9, 279.4]);
  });

  it("swaps width and height for landscape", () => {
    expect(pageSizeForFormat("A4", "landscape")).toEqual([297, 210]);
    expect(pageSizeForFormat("Tabloid", "landscape")).toEqual([431.8, 279.4]);
  });

  it("falls back to A4 when the format is unknown", () => {
    expect(pageSizeForFormat("Unknown")).toEqual(PAGE_SIZES_MM.A4);
    expect(pageSizeForFormat(undefined)).toEqual(PAGE_SIZES_MM.A4);
  });

  it("defaults to portrait when orientation is omitted", () => {
    expect(pageSizeForFormat("A5")).toEqual([148, 210]);
  });
});
