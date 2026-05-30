import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Orientation, PageFormat, Template } from "../../types/generated/template";
import type { TemplateSchemaMetadata } from "../../types/template";
import { DocumentSettingsInspector } from "./DocumentSettingsInspector";

const metadata = {
  kind: "template",
  templateVersion: 1,
  renderEndpoint: "/render/template",
  templateFields: ["version", "config", "rows"],
  attachmentFields: [],
  externalFontFields: [],
  bundledFonts: ["Inter", "Source Sans 3"],
  blockOrder: ["heading", "text"],
  pageFormats: [{ name: "A4", widthMm: 210, heightMm: 297 }],
} satisfies TemplateSchemaMetadata;

describe("DocumentSettingsInspector", () => {
  it("renders document-scoped settings instead of selected-block copy", () => {
    render(
      <DocumentSettingsInspector
        template={{ version: 1 }}
        metadata={metadata}
        format="A4"
        orientation="portrait"
        onChangeTemplate={() => undefined}
        onChangeFormat={() => undefined}
        onChangeOrientation={() => undefined}
      />,
    );

    expect(
      screen.getByRole("complementary", { name: "Document settings inspector" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Document settings" })).toBeInTheDocument();
    expect(screen.getByText("Changes apply to the whole template.")).toBeInTheDocument();
    expect(screen.getByText("Page setup")).toBeInTheDocument();
    expect(screen.getByText("Page margins")).toBeInTheDocument();
    expect(screen.getByText("Template typography")).toBeInTheDocument();
    expect(screen.queryByText("Footer")).not.toBeInTheDocument();
    expect(screen.queryByText("Select a block to inspect it.")).not.toBeInTheDocument();
  });

  it("updates template typography defaults", () => {
    const onChangeTemplate = vi.fn();
    render(
      <DocumentSettingsInspector
        template={{ version: 1 }}
        metadata={metadata}
        format="A4"
        orientation="portrait"
        onChangeTemplate={onChangeTemplate}
        onChangeFormat={() => undefined}
        onChangeOrientation={() => undefined}
      />,
    );

    fireEvent.change(screen.getByLabelText("Family"), { target: { value: "Source Sans 3" } });

    expect(onChangeTemplate).toHaveBeenLastCalledWith({
      version: 1,
      config: { typography: { family: "Source Sans 3" } },
    });
  });

  it("updates page margins while preserving footer rows and page numbers", () => {
    const template = {
      version: 1,
      config: {
        page: {
          pageNumbers: { enabled: true, position: "right" },
          footer: {
            repeat: false,
            rows: [{ blocks: [{ type: "text", id: "footer", text: "Footer" }] }],
          },
        },
      },
    } satisfies Template;
    const onChangeTemplate = vi.fn();
    render(
      <DocumentSettingsInspector
        template={template}
        metadata={metadata}
        format="A4"
        orientation="portrait"
        onChangeTemplate={onChangeTemplate}
        onChangeFormat={() => undefined}
        onChangeOrientation={() => undefined}
      />,
    );

    fireEvent.change(screen.getByLabelText("Left (mm)"), { target: { value: "18" } });

    expect(onChangeTemplate).toHaveBeenLastCalledWith({
      ...template,
      config: {
        page: {
          pageNumbers: { enabled: true, position: "right" },
          footer: {
            repeat: false,
            rows: [{ blocks: [{ type: "text", id: "footer", text: "Footer" }] }],
          },
          margins: { left: 18 },
        },
      },
    });
  });

  it("keeps page size and orientation on document-level handlers", () => {
    const onChangeFormat = vi.fn<(format: PageFormat) => void>();
    const onChangeOrientation = vi.fn<(orientation: Orientation) => void>();
    render(
      <DocumentSettingsInspector
        template={{ version: 1 }}
        metadata={metadata}
        format="A4"
        orientation="portrait"
        onChangeTemplate={() => undefined}
        onChangeFormat={onChangeFormat}
        onChangeOrientation={onChangeOrientation}
      />,
    );

    fireEvent.change(screen.getByLabelText("Page size"), { target: { value: "A5" } });
    fireEvent.change(screen.getByLabelText("Orientation"), { target: { value: "landscape" } });

    expect(onChangeFormat).toHaveBeenCalledWith("A5");
    expect(onChangeOrientation).toHaveBeenCalledWith("landscape");
  });
});
