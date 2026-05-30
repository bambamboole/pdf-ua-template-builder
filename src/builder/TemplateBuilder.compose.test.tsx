import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TemplateSchemaResponse } from "../types/template";
import { fetchTemplateSchema, renderTemplatePdf } from "../api/pdfUaApi";
import { TemplateBuilder } from "./TemplateBuilder";

vi.mock("../api/pdfUaApi", () => ({
  fetchTemplateSchema: vi.fn(),
  renderTemplatePdf: vi.fn(),
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
    templateVersion: 1,
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

function StackedBuilder() {
  return (
    <TemplateBuilder.Provider>
      <div className="flex flex-col">
        <TemplateBuilder.Toolbar />
        <TemplateBuilder.Palette />
        <div className="grid grid-cols-[320px_1fr]">
          <TemplateBuilder.Inspector />
          <TemplateBuilder.Canvas className="h-[36rem]" />
        </div>
        <TemplateBuilder.Preview className="h-[40rem]" />
      </div>
    </TemplateBuilder.Provider>
  );
}

describe("composable TemplateBuilder parts", () => {
  beforeEach(() => {
    mockFetchSchema.mockReset();
    mockFetchSchema.mockResolvedValue(builderSchema);
    vi.mocked(renderTemplatePdf).mockReset();
    URL.createObjectURL = vi.fn(() => "blob:mock-pdf");
    URL.revokeObjectURL = vi.fn();
  });

  it("renders every pane within one provider in a custom stacked layout", async () => {
    render(<StackedBuilder />);

    expect(screen.getByRole("banner", { name: "Template builder toolbar" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Block palette" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Output" })).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Load example" })).toBeEnabled(),
    );
  });

  it("shares state across parts: loading the example through the toolbar fills the canvas", async () => {
    const user = userEvent.setup();

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
    expect(
      screen.getByText(/Please transfer the amount due within 30 days/i),
    ).toBeInTheDocument();
  });
});
