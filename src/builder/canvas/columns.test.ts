import { describe, expect, it } from "vitest";
import { formatWidths, gridTemplateForWidths, parseWidths, setBoundary } from "./columns";

describe("column width helpers", () => {
  it("returns equal integer-ish percentages when widths are missing", () => {
    expect(parseWidths(null, 3)).toEqual([33, 33, 34]);
  });

  it("returns equal integer-ish percentages when widths have an invalid length", () => {
    expect(parseWidths(["60%", "40%"], 3)).toEqual([33, 33, 34]);
  });

  it("returns equal integer-ish percentages when widths contain non-percent CSS values", () => {
    expect(parseWidths(["80mm", "20%"], 2)).toEqual([50, 50]);
  });

  it("accepts percent strings with whitespace and number widths", () => {
    expect(parseWidths([" 60% ", 40], 2)).toEqual([60, 40]);
  });

  it("formats percentages for block config and CSS grid tracks", () => {
    expect(formatWidths([60, 40])).toEqual(["60%", "40%"]);
    expect(gridTemplateForWidths(["60%", "40%"], 2)).toBe(
      "minmax(0, 60fr) 0.375rem minmax(0, 40fr)",
    );
  });

  it("returns null grid template when no widths are provided", () => {
    expect(gridTemplateForWidths(null, 2)).toBeNull();
  });

  it("adjusts adjacent widths while preserving pair total and minimum sides", () => {
    expect(setBoundary([50, 50], 0, 80)).toEqual([80, 20]);
    expect(setBoundary([50, 50], 0, 2)).toEqual([5, 95]);
  });
});
