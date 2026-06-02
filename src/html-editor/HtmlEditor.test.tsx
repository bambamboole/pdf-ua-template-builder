import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHtmlPdf } from "../api/pdfUaApi";
import { HtmlEditor } from "./HtmlEditor";

vi.mock("../api/pdfUaApi", () => ({
  renderHtmlPdf: vi.fn(),
  resolveDefaultApiUrl: (configuredApiUrl?: string) => configuredApiUrl ?? "",
}));

const mockRenderHtmlPdf = vi.mocked(renderHtmlPdf);

describe("HtmlEditor", () => {
  beforeEach(() => {
    mockRenderHtmlPdf.mockReset();
    mockRenderHtmlPdf.mockResolvedValue(new Blob(["%PDF-1.7"], { type: "application/pdf" }));
    URL.createObjectURL = vi.fn(() => "blob:mock-pdf");
    URL.revokeObjectURL = vi.fn();
  });

  it("renders the HTML editor and preview", () => {
    render(<HtmlEditor initialHtml="<h1>Hi</h1>" />);

    expect(screen.getByRole("complementary", { name: "Output" })).toBeInTheDocument();
    expect(screen.getByLabelText("Template HTML editor")).toBeInTheDocument();
  });

  it("renders the seeded HTML through the backend", async () => {
    const user = userEvent.setup();
    render(<HtmlEditor apiUrl="https://example.test" initialHtml="<h1>Hi</h1>" />);

    const renderButton = screen.getByRole("button", { name: "Render PDF" });
    expect(renderButton).toBeEnabled();

    await user.click(renderButton);

    await waitFor(() => expect(mockRenderHtmlPdf).toHaveBeenCalledTimes(1));
    expect(mockRenderHtmlPdf).toHaveBeenCalledWith("https://example.test", {
      html: "<h1>Hi</h1>",
      baseUrl: undefined,
    });
  });

  it("disables Render when the HTML is empty", () => {
    render(<HtmlEditor initialHtml="   " />);

    expect(screen.getByRole("button", { name: "Render PDF" })).toBeDisabled();
  });

  it("forwards a baseUrl for asset resolution", async () => {
    const user = userEvent.setup();
    render(
      <HtmlEditor
        apiUrl="https://example.test"
        baseUrl="https://assets.test"
        initialHtml="<p>x</p>"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Render PDF" }));

    await waitFor(() => expect(mockRenderHtmlPdf).toHaveBeenCalledTimes(1));
    expect(mockRenderHtmlPdf).toHaveBeenCalledWith("https://example.test", {
      html: "<p>x</p>",
      baseUrl: "https://assets.test",
    });
  });
});
