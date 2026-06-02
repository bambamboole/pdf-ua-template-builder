import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./api/pdfUaApi", () => ({
  fetchTemplateSchema: vi.fn().mockResolvedValue({
    "x-pdfUa": {
      kind: "template",
      templateVersion: 2,
      renderEndpoint: "/render/template",
      templateFields: [],
      attachmentFields: [],
      externalFontFields: [],
      bundledFonts: [],
      blockOrder: [],
      pageFormats: [],
    },
  }),
  renderTemplatePdf: vi.fn(),
  renderHtmlPdf: vi.fn(),
  resolveDefaultApiUrl: (configuredApiUrl?: string) => configuredApiUrl ?? "",
}));

describe("App shell", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:mock-pdf");
    URL.revokeObjectURL = vi.fn();
  });

  it("shows the builder by default", async () => {
    render(<App />);

    expect(screen.getByRole("tab", { name: "Template builder" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    // The builder is lazy-loaded, so it resolves through a Suspense fallback first.
    expect(await screen.findByRole("complementary", { name: "Block palette" })).toBeInTheDocument();
  });

  it("switches to the HTML editor tab", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: "HTML editor" }));

    expect(await screen.findByLabelText("Template HTML editor")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "HTML editor" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("switches to the JSON editor tab", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: "Template editor" }));

    expect(await screen.findByLabelText("Template JSON editor")).toBeInTheDocument();
  });
});
