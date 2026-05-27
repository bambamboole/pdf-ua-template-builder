import { describe, expect, it } from "vitest";
import { resolveDefaultApiUrl } from "./pdfUaApi";

describe("resolveDefaultApiUrl", () => {
  it("uses the same-origin Vite proxy when no explicit API URL is configured", () => {
    expect(resolveDefaultApiUrl()).toBe("");
  });

  it("uses an explicit API URL when one is configured", () => {
    expect(resolveDefaultApiUrl("http://0.0.0.0:8080")).toBe("http://0.0.0.0:8080");
  });
});
