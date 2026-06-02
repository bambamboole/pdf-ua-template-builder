import { describe, expect, it } from "vitest";
import { parseTemplate } from "./parseTemplate";

describe("parseTemplate", () => {
  it("parses a valid template object", () => {
    const result = parseTemplate('{ "version": 2 }');
    expect(result.error).toBeNull();
    expect(result.template).toEqual({ version: 2 });
  });

  it("returns an error for malformed JSON", () => {
    const result = parseTemplate('{ "version": ');
    expect(result.template).toBeNull();
    expect(result.error).toMatch(/./);
  });

  it("treats empty input as nothing to render, without an error", () => {
    const result = parseTemplate("   ");
    expect(result.template).toBeNull();
    expect(result.error).toBeNull();
  });

  it("rejects valid JSON that is not an object", () => {
    const result = parseTemplate("42");
    expect(result.template).toBeNull();
    expect(result.error).toMatch(/object/i);
  });
});
