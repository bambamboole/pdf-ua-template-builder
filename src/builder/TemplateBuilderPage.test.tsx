import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createEditorModel } from "./state/editorModel";
import { createNextBlockId } from "./TemplateBuilderPage";
import { PdfPane } from "./pdf/PdfPane";

describe("PdfPane", () => {
  it("server-renders PDF objects without iframe sandboxing", () => {
    const html = renderToStaticMarkup(
      <PdfPane pdfUrl="blob:http://localhost:5174/test" error={null} loading={false} />,
    );

    expect(html).toContain('data="blob:http://localhost:5174/test"');
    expect(html).not.toContain("sandbox=");
  });
});

describe("createNextBlockId", () => {
  it("creates ids from the current serialized model", () => {
    const model = createEditorModel({
      version: 1,
      rows: [
        {
          blocks: [
            { type: "heading", id: "heading-1", text: "Title" },
            { type: "text", id: "text-1", text: "Body" },
          ],
        },
      ],
    });

    expect(createNextBlockId(model, "heading")).toBe("heading-2");
    expect(createNextBlockId(model, "divider")).toBe("divider-1");
  });
});
