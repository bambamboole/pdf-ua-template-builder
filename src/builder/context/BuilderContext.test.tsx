import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TemplateSchemaResponse } from "../../types/template";
import { fetchTemplateSchema, renderTemplatePreview } from "../../api/pdfUaApi";
import { TemplateBuilderProvider, useTemplateBuilder } from "./BuilderContext";

vi.mock("../../api/pdfUaApi", () => ({
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
    blockOrder: ["heading"],
    pageFormats: [],
  },
} satisfies TemplateSchemaResponse;

const mockFetchSchema = vi.mocked(fetchTemplateSchema);

function ContextProbe() {
  const { schema, blockTypes } = useTemplateBuilder();

  return (
    <div>
      <span data-testid="schema-loaded">{schema ? "yes" : "no"}</span>
      <span data-testid="block-count">{blockTypes.length}</span>
    </div>
  );
}

describe("TemplateBuilderProvider", () => {
  beforeEach(() => {
    mockFetchSchema.mockReset();
    mockFetchSchema.mockResolvedValue(builderSchema);
    vi.mocked(renderTemplatePreview).mockReset();
    URL.createObjectURL = vi.fn(() => "blob:mock-pdf");
    URL.revokeObjectURL = vi.fn();
  });

  it("throws when the context hook is used outside a provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<ContextProbe />)).toThrow(
      /must be used within a <TemplateBuilderProvider>/,
    );

    consoleError.mockRestore();
  });

  it("auto-loads the schema on mount and exposes it through context", async () => {
    render(
      <TemplateBuilderProvider apiUrl="https://example.test">
        <ContextProbe />
      </TemplateBuilderProvider>,
    );

    expect(mockFetchSchema).toHaveBeenCalledWith("https://example.test");
    expect(screen.getByTestId("schema-loaded")).toHaveTextContent("no");

    await waitFor(() => expect(screen.getByTestId("schema-loaded")).toHaveTextContent("yes"));
    expect(screen.getByTestId("block-count")).toHaveTextContent("1");
  });
});
