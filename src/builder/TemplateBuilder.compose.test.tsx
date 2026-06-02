import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TemplateSchemaResponse } from "../types/template";
import { fetchTemplateSchema, renderTemplatePreview } from "../api/pdfUaApi";
import { Builder } from "./Builder";
import { TemplateBuilderProvider } from "./context/BuilderContext";
import { Preview } from "../render/Preview";
import { createInvoiceExample } from "./schema/invoiceExample";

vi.mock("../api/pdfUaApi", () => ({
  fetchTemplateSchema: vi.fn(),
  renderTemplatePreview: vi.fn(),
  resolveDefaultApiUrl: (configuredApiUrl?: string) => configuredApiUrl ?? "",
}));

const builderSchema = {
  $defs: {
    block: {
      oneOf: [
        {
          type: "object",
          properties: { type: { const: "heading" }, text: { type: "string" } },
          required: ["type", "text"],
        },
        {
          type: "object",
          properties: { type: { const: "text" }, text: { type: "string" } },
          required: ["type", "text"],
        },
      ],
    },
  },
  "x-pdfUa": {
    kind: "template",
    templateVersion: 2,
    renderEndpoint: "/render/template",
    templateFields: [],
    attachmentFields: [],
    externalFontFields: [],
    bundledFonts: [],
    blockOrder: ["heading", "text"],
    pageFormats: [],
  },
} satisfies TemplateSchemaResponse;

const mockFetchSchema = vi.mocked(fetchTemplateSchema);
const mockRenderPreview = vi.mocked(renderTemplatePreview);

function StackedBuilder() {
  return (
    <TemplateBuilderProvider>
      <div className="flex flex-col">
        <Builder examples={{ Invoice: createInvoiceExample() }} className="h-[36rem]" />
        <Preview className="h-[40rem]" />
      </div>
    </TemplateBuilderProvider>
  );
}

describe("composing Builder and Preview", () => {
  beforeEach(() => {
    mockFetchSchema.mockReset();
    mockFetchSchema.mockResolvedValue(builderSchema);
    mockRenderPreview.mockReset();
    URL.createObjectURL = vi.fn(() => "blob:mock-pdf");
    URL.revokeObjectURL = vi.fn();
  });

  it("renders both regions within one provider in a custom stacked layout", async () => {
    render(<StackedBuilder />);

    expect(screen.getByRole("region", { name: "Template authoring" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Block palette" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Output" })).toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole("button", { name: "Load example" })).toBeEnabled());
  });

  it("shares state: Load example (Builder) fills the canvas and Render (Preview) calls the API", async () => {
    const user = userEvent.setup();
    mockRenderPreview.mockResolvedValue({
      pdf: new Blob(["%PDF-1.7"], { type: "application/pdf" }),
      validation: validValidation,
    });

    render(<StackedBuilder />);

    const loadExample = await waitFor(() => {
      const button = screen.getByRole("button", { name: "Load example" });
      expect(button).toBeEnabled();
      return button;
    });

    expect(screen.getByText("Drop a block here to begin")).toBeInTheDocument();

    await user.click(loadExample);

    await waitFor(() =>
      expect(screen.queryByText("Drop a block here to begin")).not.toBeInTheDocument(),
    );
    expect(screen.getByText(/Please transfer the amount due within 30 days/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Render PDF" }));

    await waitFor(() => expect(mockRenderPreview).toHaveBeenCalledTimes(1));
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
