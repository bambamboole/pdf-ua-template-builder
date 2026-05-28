import { describe, expect, it } from "vitest";
import { mmToPx } from "./displayScale";

describe("mmToPx", () => {
  it("converts an inch to 96px", () => {
    expect(mmToPx(25.4)).toBe(96);
  });

  it("rounds the result to the nearest integer", () => {
    expect(mmToPx(210)).toBe(794);
    expect(mmToPx(297)).toBe(1123);
    expect(mmToPx(148)).toBe(559);
    expect(mmToPx(215.9)).toBe(816);
  });

  it("returns 0 for 0mm", () => {
    expect(mmToPx(0)).toBe(0);
  });
});
