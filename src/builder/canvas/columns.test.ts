import { describe, expect, it } from "vitest";
import {
  distribute,
  formatWidths,
  gridTemplateForWidths,
  labelWidthPercent,
  parseWidths,
  percentWidth,
  setBoundary,
  tableColumnTracks,
} from "./columns";

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

  it("rounds the dragged boundary to whole percentages", () => {
    expect(setBoundary([50, 50], 0, 60.7)).toEqual([61, 39]);
    expect(setBoundary([50, 50], 0, 33.2)).toEqual([33, 67]);
  });

  it("derives a clamped whole-percent label width with a default fallback", () => {
    expect(labelWidthPercent("40%")).toBe(40);
    expect(labelWidthPercent("40.6%")).toBe(41);
    expect(labelWidthPercent("30mm")).toBe(30);
    expect(labelWidthPercent(undefined)).toBe(30);
    expect(labelWidthPercent("2%")).toBe(5);
    expect(labelWidthPercent("140%")).toBe(95);
  });

  it("distributes a total into whole shares with the remainder on the last", () => {
    expect(distribute(4, 100)).toEqual([25, 25, 25, 25]);
    expect(distribute(3, 100)).toEqual([33, 33, 34]);
    expect(distribute(4, 95)).toEqual([23, 23, 23, 26]);
    expect(distribute(0, 100)).toEqual([]);
  });

  it("reads a percentage width or null for non-percent values", () => {
    expect(percentWidth("30%")).toBe(30);
    expect(percentWidth("30mm")).toBeNull();
    expect(percentWidth(undefined)).toBeNull();
  });

  it("builds table column tracks, reserving 5% for the number column", () => {
    expect(tableColumnTracks([null, null], false)).toEqual({ tracks: [50, 50], data: [50, 50] });
    expect(tableColumnTracks([null, null], true)).toEqual({ tracks: [5, 47, 48], data: [47, 48] });
    expect(tableColumnTracks(["60%", "40%"], false)).toEqual({ tracks: [60, 40], data: [60, 40] });
    expect(tableColumnTracks(["55%", "40%"], true)).toEqual({ tracks: [5, 55, 40], data: [55, 40] });
    expect(tableColumnTracks(["60%", "40mm"], false)).toEqual({ tracks: [50, 50], data: [50, 50] });
  });
});
