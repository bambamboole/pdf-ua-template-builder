import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Block } from "../../types/generated/template";
import type { TemplateSchemaMetadata } from "../../types/template";
import { TypographyControls } from "./TypographyControls";

const metadata = {
  kind: "template",
  templateVersion: 1,
  renderEndpoint: "/render/template",
  templateFields: ["version", "rows"],
  attachmentFields: [],
  externalFontFields: [],
  bundledFonts: ["Inter", "Source Sans 3"],
  blockOrder: ["heading", "text"],
  pageFormats: [{ name: "A4", widthMm: 210, heightMm: 297 }],
} satisfies TemplateSchemaMetadata;

describe("TypographyControls", () => {
  it("renders family, size, weight, align, and color fields", () => {
    render(
      <TypographyControls
        target="block"
        block={{
          type: "heading",
          text: "Title",
          config: {
            typography: {
              family: "Inter",
              size: 14,
              weight: "700",
              align: "center",
              color: "#112233",
            },
          },
        }}
        metadata={metadata}
        onChangeBlock={() => undefined}
      />,
    );

    expect(screen.getByLabelText("Family")).toHaveValue("Inter");
    expect(screen.getByLabelText("Size")).toHaveValue(14);
    expect(screen.getByLabelText("Weight")).toHaveValue("700");
    expect(screen.getByLabelText("Align")).toHaveValue("center");
    expect(screen.getByLabelText("Color")).toHaveValue("#112233");
  });

  it("updates block typography through nested block config", () => {
    const block = {
      type: "heading",
      text: "Title",
      config: { level: 2 },
    } satisfies Block;
    const onChangeBlock = vi.fn();
    render(
      <TypographyControls
        target="block"
        block={block}
        metadata={metadata}
        onChangeBlock={onChangeBlock}
      />,
    );

    fireEvent.change(screen.getByLabelText("Family"), { target: { value: "Source Sans 3" } });
    expect(onChangeBlock).toHaveBeenLastCalledWith({
      ...block,
      config: { level: 2, typography: { family: "Source Sans 3" } },
    });

    fireEvent.change(screen.getByLabelText("Size"), { target: { value: "18" } });
    expect(onChangeBlock).toHaveBeenLastCalledWith({
      ...block,
      config: { level: 2, typography: { size: 18 } },
    });
  });

  it("clears block typography when a field is emptied", () => {
    const onChangeBlock = vi.fn();
    render(
      <TypographyControls
        target="block"
        block={{
          type: "heading",
          text: "Title",
          config: { level: 2, typography: { family: "Inter" } },
        }}
        metadata={metadata}
        onChangeBlock={onChangeBlock}
      />,
    );

    fireEvent.change(screen.getByLabelText("Family"), { target: { value: "" } });

    expect(onChangeBlock).toHaveBeenLastCalledWith({
      type: "heading",
      text: "Title",
      config: { level: 2 },
    });
  });

  it("updates template typography through template config", () => {
    const onChangeTemplate = vi.fn();
    render(
      <TypographyControls
        target="template"
        template={{ version: 1 }}
        metadata={metadata}
        onChangeTemplate={onChangeTemplate}
      />,
    );

    fireEvent.change(screen.getByLabelText("Align"), { target: { value: "right" } });

    expect(onChangeTemplate).toHaveBeenLastCalledWith({
      version: 1,
      config: { typography: { align: "right" } },
    });
  });

  it("renders bundled font options as a select when metadata is passed", () => {
    render(
      <TypographyControls
        target="template"
        template={{ version: 1 }}
        metadata={metadata}
        onChangeTemplate={() => undefined}
      />,
    );

    const family = screen.getByLabelText("Family");
    expect(family.tagName).toBe("SELECT");
    expect(within(family).getByRole("option", { name: "Inter" })).toBeInTheDocument();
    expect(within(family).getByRole("option", { name: "Source Sans 3" })).toBeInTheDocument();
  });
});
