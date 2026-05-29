import type { ReactNode } from "react";
import type { Orientation, PageFormat, Template } from "../../types/generated/template";
import type { TemplateSchemaMetadata } from "../../types/template";
import { Chip } from "../primitives/Chip";
import { CheckboxField, SelectField } from "../forms/controls";
import { PAGE_SIZES_MM } from "../lib/pageSizes";
import type { PageNumbersValue } from "../state/editorModel";
import { InspectorHeader, InspectorSection, InspectorShell } from "./InspectorShell";
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

const pageNumberOptions = [
  { value: "disabled", label: "Disabled" },
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
] as const satisfies ReadonlyArray<{ value: PageNumbersValue; label: string }>;

export interface DocumentSettingsInspectorProps {
  template: Template;
  metadata?: Pick<TemplateSchemaMetadata, "bundledFonts">;
  format: PageFormat;
  orientation: Orientation;
  footerRepeat: boolean;
  pageNumbers: PageNumbersValue;
  onChangeTemplate: (template: Template) => void;
  onChangeFormat: (format: PageFormat) => void;
  onChangeOrientation: (orientation: Orientation) => void;
  onToggleFooterRepeat: (repeat: boolean) => void;
  onChangePageNumbers: (value: PageNumbersValue) => void;
}

export function DocumentSettingsInspector({
  template,
  metadata,
  format,
  orientation,
  footerRepeat,
  pageNumbers,
  onChangeTemplate,
  onChangeFormat,
  onChangeOrientation,
  onToggleFooterRepeat,
  onChangePageNumbers,
}: DocumentSettingsInspectorProps): ReactNode {
  return (
    <InspectorShell ariaLabel="Document settings inspector">
      <InspectorHeader
        chip={<Chip wide>Doc</Chip>}
        title="Document settings"
        subtitle="Changes apply to the whole template."
      />

      <div className="grid gap-2" aria-label="Document settings sections">
        <InspectorSection title="Page setup">
          <div className="grid gap-2">
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

        <InspectorSection title="Footer">
          <div className="grid gap-2">
            <CheckboxField
              name="document.page.footer.repeat"
              label="Repeat footer"
              checked={footerRepeat}
              help="Applies the existing footer rows to every page."
              onChange={onToggleFooterRepeat}
            />
            <SelectField
              name="document.page.pageNumbers"
              label="Page numbers"
              value={pageNumbers}
              options={pageNumberOptions}
              onChange={(value) => onChangePageNumbers(value ?? "disabled")}
            />
          </div>
        </InspectorSection>

        <InspectorSection title="Template typography">
          <TypographyControls
            target="template"
            template={template}
            metadata={metadata}
            onChangeTemplate={onChangeTemplate}
          />
        </InspectorSection>
      </div>
    </InspectorShell>
  );
}
