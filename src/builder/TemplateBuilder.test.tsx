import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Template } from "../types/generated/template";
import type { TemplateData, TemplateSchemaResponse } from "../types/template";
import { fetchTemplateSchema, renderTemplatePdf } from "../api/pdfUaApi";
import { TemplateBuilder } from "./TemplateBuilder";
import { createInvoiceExample } from "./schema/invoiceExample";

const examples = { Invoice: createInvoiceExample() };

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
const mockRenderPdf = vi.mocked(renderTemplatePdf);

describe("TemplateBuilder", () => {
  beforeEach(() => {
    mockFetchSchema.mockReset();
    mockRenderPdf.mockReset();
    mockFetchSchema.mockResolvedValue(builderSchema);
    URL.createObjectURL = vi.fn(() => "blob:mock-pdf");
    URL.revokeObjectURL = vi.fn();
  });

  it("loads the schema on mount and enables building once it resolves", async () => {
    render(<TemplateBuilder examples={examples} />);

    expect(mockFetchSchema).toHaveBeenCalledWith("");
    expect(screen.getByRole("button", { name: "Load example" })).toBeDisabled();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Load example" })).toBeEnabled(),
    );
  });

  it("surfaces a schema load failure", async () => {
    mockFetchSchema.mockRejectedValue(new Error("schema unavailable"));

    render(<TemplateBuilder examples={examples} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("schema unavailable");
    expect(screen.getByRole("button", { name: "Load example" })).toBeDisabled();
  });

  it("renders a PDF and reports the blob when Render is clicked", async () => {
    const user = userEvent.setup();
    const pdf = new Blob(["%PDF-1.7"], { type: "application/pdf" });
    mockRenderPdf.mockResolvedValue(pdf);
    const onRendered = vi.fn<(pdf: Blob) => void>();

    render(<TemplateBuilder onRendered={onRendered} />);
    const renderButton = await waitFor(() => {
      const button = screen.getByRole("button", { name: "Render PDF" });
      expect(button).toBeEnabled();
      return button;
    });

    await user.click(renderButton);

    await waitFor(() => expect(mockRenderPdf).toHaveBeenCalledTimes(1));
    expect(mockRenderPdf).toHaveBeenCalledWith(
      "",
      expect.objectContaining({
        template: expect.objectContaining({ version: 1 }),
        data: {},
        options: { title: "Template Preview" },
      }),
    );
    await waitFor(() => expect(onRendered).toHaveBeenCalledWith(pdf));
    expect(URL.createObjectURL).toHaveBeenCalledWith(pdf);
  });

  it("notifies onChange after an edit but not on initial mount", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(template: Template, data: TemplateData) => void>();

    render(<TemplateBuilder examples={examples} onChange={onChange} />);
    const loadExample = await waitFor(() => {
      const button = screen.getByRole("button", { name: "Load example" });
      expect(button).toBeEnabled();
      return button;
    });

    expect(onChange).not.toHaveBeenCalled();

    await user.click(loadExample);

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const lastCall = onChange.mock.calls.at(-1);
    expect(lastCall?.[0].rows?.length ?? 0).toBeGreaterThan(0);
    expect(Object.keys(lastCall?.[1] ?? {})).toContain("lineItems");
  });
});
