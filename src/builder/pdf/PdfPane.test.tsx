import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PdfPane } from "./PdfPane";

describe("PdfPane", () => {
  it("server-renders PDF objects without iframe sandboxing", () => {
    const html = renderToStaticMarkup(
      <PdfPane pdfUrl="blob:http://localhost:5174/test" error={null} loading={false} />,
    );

    expect(html).toContain('data="blob:http://localhost:5174/test"');
    expect(html).not.toContain("sandbox=");
  });
});
