import { describe, expect, it } from "vitest";
import { nextKeyIndex } from "./records";

describe("nextKeyIndex", () => {
  it("starts at 1 for an empty set", () => {
    expect(nextKeyIndex([], "column")).toBe(1);
  });

  it("returns length + 1 when that key is free", () => {
    expect(nextKeyIndex(["column1", "column2"], "column")).toBe(3);
  });

  it("skips past a collision at the candidate index", () => {
    expect(nextKeyIndex(["column1", "column3"], "column")).toBe(4);
  });

  it("only considers keys matching the prefix", () => {
    expect(nextKeyIndex(["field1"], "column")).toBe(2);
  });
});
