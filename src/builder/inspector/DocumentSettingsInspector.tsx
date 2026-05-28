import type { ReactNode } from "react";
import type { Orientation, PageFormat, Template } from "../../types/generated/template";
import type { TemplateSchemaMetadata } from "../../types/template";
import { CheckboxField, SelectField } from "../forms/controls";
import { PAGE_SIZES_MM } from "../lib/pageSizes";
import type { PageNumbersValue } from "../state/editorModel";
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
    <aside className="builder-inspector" aria-label="Document settings inspector">
      <header className="builder-inspector__header">
        <div className="builder-inspector__heading">
          <span className="builder-chip" aria-hidden="true">
            Doc
          </span>
          <div>
            <h2 className="builder-inspector__title">Document settings</h2>
            <p className="builder-inspector__summary">
              Changes apply to the whole template.
            </p>
          </div>
        </div>
      </header>

      <div className="builder-inspector__sections" aria-label="Document settings sections">
        <section className="builder-inspector__section">
          <h3>Page setup</h3>
          <div className="document-settings__field-grid">
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
        </section>

        <section className="builder-inspector__section">
          <SpacingControls
            scope="page"
            template={template}
            onChangeTemplate={onChangeTemplate}
          />
        </section>

        <section className="builder-inspector__section">
          <h3>Footer</h3>
          <div className="document-settings__field-grid">
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
        </section>

        <section className="builder-inspector__section">
          <TypographyControls
            target="template"
            template={template}
            metadata={metadata}
            title="Template typography"
            onChangeTemplate={onChangeTemplate}
          />
        </section>
      </div>
    </aside>
  );
}
