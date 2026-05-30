import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PdfPane } from "./PdfPane";

describe("PdfPane", () => {
  it("renders the PDF as a non-sandboxed object", () => {
    const { container } = render(
      <PdfPane pdfUrl="blob:http://localhost:5174/test" error={null} loading={false} />,
    );

    const object = container.querySelector("object");
    expect(object).toHaveAttribute("data", "blob:http://localhost:5174/test");
    expect(object).not.toHaveAttribute("sandbox");
  });
});
