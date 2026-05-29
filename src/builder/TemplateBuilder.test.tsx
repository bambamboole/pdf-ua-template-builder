import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Template } from "../types/generated/template";
import type { TemplateData, TemplateSchemaResponse } from "../types/template";
import { fetchTemplateSchema, renderTemplatePdf } from "../api/pdfUaApi";
import { BlockInspector } from "./inspector/BlockInspector";
import { getRowIndex } from "./state/dragDrop";
import {
  createEditorModel,
  createNextBlockId,
  reconcileSelectedBlockUid,
  resolveSelectedEditorBlock,
} from "./state/editorModel";
import { TemplateBuilder } from "./TemplateBuilder";
import { PdfPane } from "./pdf/PdfPane";

vi.mock("../api/pdfUaApi", () => ({
  fetchTemplateSchema: vi.fn(),
  renderTemplatePdf: vi.fn(),
  resolveDefaultApiUrl: (configuredApiUrl?: string) => configuredApiUrl ?? "",
}));

const schema = {
  "x-pdfUa": {
    kind: "template",
    templateVersion: 1,
    renderEndpoint: "/render/template",
    templateFields: [],
    attachmentFields: [],
    externalFontFields: [],
    bundledFonts: [],
    blockOrder: ["heading", "text", "divider"],
    pageFormats: [],
  },
} satisfies TemplateSchemaResponse;

describe("PdfPane", () => {
  it("server-renders PDF objects without iframe sandboxing", () => {
    const html = renderToStaticMarkup(
      <PdfPane pdfUrl="blob:http://localhost:5174/test" error={null} loading={false} />,
    );

    expect(html).toContain('data="blob:http://localhost:5174/test"');
    expect(html).not.toContain("sandbox=");
  });
});

describe("getRowIndex", () => {
  it("resolves row drops over nested blocks to the block row", () => {
    const model = createEditorModel({
      version: 1,
      rows: [
        { blocks: [{ type: "heading", id: "heading-1", text: "Title" }] },
        { blocks: [{ type: "text", id: "text-1", text: "Body" }] },
      ],
    });

    expect(
      getRowIndex(model, model.rows[1].blocks[0].uid, {
        type: "block",
        rowUid: model.rows[1].uid,
        blockUid: model.rows[1].blocks[0].uid,
      }),
    ).toBe(1);
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

describe("selected block inspector", () => {
  it("resolves a selected canvas block and renders the inspector shell", () => {
    const model = createEditorModel({
      version: 1,
      rows: [{ blocks: [{ type: "heading", id: "heading-1", text: "Title" }] }],
    });
    const selectedBlockUid = model.rows[0]?.blocks[0]?.uid ?? "";
    const selectedBlock = resolveSelectedEditorBlock(model, selectedBlockUid);

    const html = renderToStaticMarkup(
      <BlockInspector
        block={selectedBlock}
        schema={schema}
        data={{}}
        onChangeBlock={() => undefined}
        onRemoveBlock={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(html).toContain('aria-label="Block inspector"');
    expect(html).toContain("Heading");
    expect(html).toContain("heading-1");
    expect(html).toContain(selectedBlockUid);
    expect(html).toContain("Content");
    expect(html).toContain("Layout");
    expect(html).toContain("Typography");
    expect(html).toContain("Spacing");
  });

  it("clears the selected block uid after that block is removed", () => {
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
    const removedBlockUid = model.rows[0]?.blocks[0]?.uid ?? "";
    const nextModel = createEditorModel({
      version: 1,
      rows: [{ blocks: [{ type: "text", id: "text-1", text: "Body" }] }],
    });

    expect(reconcileSelectedBlockUid(model, removedBlockUid)).toBe(removedBlockUid);
    expect(reconcileSelectedBlockUid(nextModel, removedBlockUid)).toBeNull();

    const html = renderToStaticMarkup(
      <BlockInspector
        block={resolveSelectedEditorBlock(nextModel, removedBlockUid)}
        schema={schema}
        data={{}}
        onChangeBlock={() => undefined}
        onRemoveBlock={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(html).toContain("Select a block to inspect it.");
    expect(html).not.toContain("heading-1");
  });
});

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
    render(<TemplateBuilder />);

    expect(mockFetchSchema).toHaveBeenCalledWith("");
    expect(screen.getByRole("button", { name: "Load example" })).toBeDisabled();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Load example" })).toBeEnabled(),
    );
  });

  it("surfaces a schema load failure", async () => {
    mockFetchSchema.mockRejectedValue(new Error("schema unavailable"));

    render(<TemplateBuilder />);

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

    render(<TemplateBuilder onChange={onChange} />);
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
