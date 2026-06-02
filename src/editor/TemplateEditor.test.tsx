import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderTemplatePreview } from "../api/pdfUaApi";
import { TemplateEditor } from "./TemplateEditor";

vi.mock("../api/pdfUaApi", () => ({
  fetchTemplateSchema: vi.fn(),
  renderTemplatePreview: vi.fn(),
  resolveDefaultApiUrl: (configuredApiUrl?: string) => configuredApiUrl ?? "",
}));

const mockRenderPreview = vi.mocked(renderTemplatePreview);

describe("TemplateEditor", () => {
  beforeEach(() => {
    mockRenderPreview.mockReset();
    mockRenderPreview.mockResolvedValue({
      pdf: new Blob(["%PDF-1.7"], { type: "application/pdf" }),
      validation: validValidation,
    });
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

    await waitFor(() => expect(mockRenderPreview).toHaveBeenCalledTimes(1));
    expect(mockRenderPreview).toHaveBeenCalledWith(
      "https://example.test",
      expect.objectContaining({ template: { version: 2 }, data: {} }),
    );
  });
});

const validValidation = {
  isCompliant: true,
  profiles: [],
  summary: {
    totalChecks: 1,
    passedChecks: 1,
    failedChecks: 0,
    categories: [],
  },
  failures: [],
};
