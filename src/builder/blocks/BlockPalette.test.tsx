import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BlockPalette } from "./BlockPalette";

describe("BlockPalette", () => {
  it("server-renders schema-derived block labels", () => {
    const html = renderToStaticMarkup(<BlockPalette blockTypes={["heading", "text", "divider"]} />);

    expect(html).toContain("+ Heading");
    expect(html).toContain("+ Text");
    expect(html).toContain("+ Divider");
  });
});
