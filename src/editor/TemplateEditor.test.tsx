import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderTemplatePdf } from "../api/pdfUaApi";
import { TemplateEditor } from "./TemplateEditor";

vi.mock("../api/pdfUaApi", () => ({
  fetchTemplateSchema: vi.fn(),
  renderTemplatePdf: vi.fn(),
  resolveDefaultApiUrl: (configuredApiUrl?: string) => configuredApiUrl ?? "",
}));

const mockRenderPdf = vi.mocked(renderTemplatePdf);

describe("TemplateEditor", () => {
  beforeEach(() => {
    mockRenderPdf.mockReset();
    mockRenderPdf.mockResolvedValue(new Blob(["%PDF-1.7"], { type: "application/pdf" }));
    URL.createObjectURL = vi.fn(() => "blob:mock-pdf");
    URL.revokeObjectURL = vi.fn();
  });

  it("renders the editor and preview", () => {
    render(<TemplateEditor initialTemplate={{ version: 2 }} />);

    expect(screen.getByRole("complementary", { name: "Output" })).toBeInTheDocument();
    expect(screen.getByLabelText("Template JSON editor")).toBeInTheDocument();
  });

  it("enables Render for a valid template and calls the API with the parsed template", async () => {
    const user = userEvent.setup();
    render(<TemplateEditor apiUrl="https://example.test" initialTemplate={{ version: 2 }} />);

    const renderButton = screen.getByRole("button", { name: "Render PDF" });
    expect(renderButton).toBeEnabled();

    await user.click(renderButton);

    await waitFor(() => expect(mockRenderPdf).toHaveBeenCalledTimes(1));
    expect(mockRenderPdf).toHaveBeenCalledWith(
      "https://example.test",
      expect.objectContaining({ template: { version: 2 }, data: {} }),
    );
  });
});
