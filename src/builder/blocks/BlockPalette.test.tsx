import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BlockPalette } from "./BlockPalette";

describe("BlockPalette", () => {
  it("server-renders block chips and labels with descriptive aria labels", () => {
    const html = renderToStaticMarkup(<BlockPalette blockTypes={["heading", "text", "divider"]} />);

    expect(html).toContain("Heading");
    expect(html).toContain("Text");
    expect(html).toContain("Divider");
    expect(html).toContain('aria-label="Add Heading"');
    expect(html).toContain('aria-label="Add Text"');
    expect(html).toContain('aria-label="Add Divider"');
  });
});
