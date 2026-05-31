import type { ReactNode } from "react";
import type { Orientation, PageFormat, Template } from "../../types/generated/template";
import type { TemplateSchemaMetadata } from "../../types/template";
import { SelectField } from "../controls";
import { PAGE_SIZES_MM } from "../lib/pageSizes";
import { InspectorSection } from "./InspectorShell";
import { SpacingControls } from "./SpacingControls";
import { TypographyControls } from "./TypographyControls";

const pageFormatOptions = Object.keys(PAGE_SIZES_MM).map((format) => ({
  value: format as PageFormat,
  label: format,
}));

const orientationOptions = [
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
] as const satisfies ReadonlyArray<{ value: Orientation; label: string }>;

export interface DocumentSettingsProps {
  template: Template;
  metadata?: Pick<TemplateSchemaMetadata, "bundledFonts">;
  format: PageFormat;
  orientation: Orientation;
  onChangeTemplate: (template: Template) => void;
  onChangeFormat: (format: PageFormat) => void;
  onChangeOrientation: (orientation: Orientation) => void;
  className?: string;
}

/**
 * Document-wide settings, laid out as a horizontal bar above the block palette.
 * Each group wraps to its own column on narrow widths.
 */
export function DocumentSettings({
  template,
  metadata,
  format,
  orientation,
  onChangeTemplate,
  onChangeFormat,
  onChangeOrientation,
  className,
}: DocumentSettingsProps): ReactNode {
  return (
    <section
      aria-label="Page settings"
      className={`grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] items-start gap-3 border-0 border-b border-solid border-border bg-surface px-4 py-3${className ? ` ${className}` : ""}`}
    >
      <InspectorSection title="Page setup">
        <div className="grid grid-cols-2 gap-2">
          <SelectField
            name="document.page.size.format"
            label="Page size"
            value={format}
            options={pageFormatOptions}
            onChange={(value) => {
              if (value) {
                onChangeFormat(value);
              }
            }}
          />
          <SelectField
            name="document.page.size.orientation"
            label="Orientation"
            value={orientation}
            options={orientationOptions}
            onChange={(value) => {
              if (value) {
                onChangeOrientation(value);
              }
            }}
          />
        </div>
      </InspectorSection>

      <InspectorSection title="Page margins">
        <SpacingControls scope="page" template={template} onChangeTemplate={onChangeTemplate} />
      </InspectorSection>

      <InspectorSection title="Template typography">
        <TypographyControls
          target="template"
          template={template}
          metadata={metadata}
          onChangeTemplate={onChangeTemplate}
        />
      </InspectorSection>
    </section>
  );
}
