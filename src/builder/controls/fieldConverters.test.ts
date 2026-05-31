import { describe, expect, it } from "vitest";
import { numberValue, selectValue, textValue } from "./fieldConverters";

describe("textValue", () => {
  it("returns the value unchanged when it is non-empty", () => {
    expect(textValue("hello", "undefined")).toBe("hello");
    expect(textValue("hello", "empty-string")).toBe("hello");
  });

  it("keeps an empty string when emptyValue is empty-string", () => {
    expect(textValue("", "empty-string")).toBe("");
  });

  it("maps an empty string to undefined when emptyValue is undefined", () => {
    expect(textValue("", "undefined")).toBeUndefined();
  });
});

describe("numberValue", () => {
  it("returns the parsed number for a valid entry", () => {
    expect(numberValue("12", 12)).toBe(12);
    expect(numberValue("0", 0)).toBe(0);
  });

  it("returns undefined for an empty input", () => {
    expect(numberValue("", Number.NaN)).toBeUndefined();
  });

  it("returns undefined when the parsed value is NaN", () => {
    expect(numberValue("abc", Number.NaN)).toBeUndefined();
  });
});

describe("selectValue", () => {
  const options = [
    { value: "left", label: "Left" },
    { value: "right", label: "Right" },
  ] as const;

  it("returns the matching option value", () => {
    expect(selectValue("right", options)).toBe("right");
  });

  it("returns undefined for the empty selection", () => {
    expect(selectValue("", options)).toBeUndefined();
  });

  it("returns undefined for a value that is not an option", () => {
    expect(selectValue("center", options)).toBeUndefined();
  });
});
