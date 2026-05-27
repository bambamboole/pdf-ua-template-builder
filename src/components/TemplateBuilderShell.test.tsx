import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PdfPreview } from "./TemplateBuilderShell";

describe("PdfPreview", () => {
  it("renders blob PDF previews without iframe sandboxing", () => {
    const html = renderToStaticMarkup(<PdfPreview pdfUrl="blob:http://localhost:5174/test" />);

    expect(html).toContain('src="blob:http://localhost:5174/test"');
    expect(html).not.toContain("sandbox=");
    expect(html).toContain('href="blob:http://localhost:5174/test"');
  });
});
