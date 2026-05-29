import type { ReactNode } from "react";
import type { Orientation, PageFormat, Template } from "../../types/generated/template";
import type { TemplateSchemaMetadata } from "../../types/template";
import { docChipClass } from "../blocks/chipStyles";
import { CheckboxField, SelectField } from "../forms/controls";
import { PAGE_SIZES_MM } from "../lib/pageSizes";
import type { PageNumbersValue } from "../state/editorModel";
import {
  inspectorClass,
  inspectorSectionClass,
  inspectorSectionHeadingClass,
  inspectorTitleClass,
} from "./inspectorStyles";
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
    <aside className={inspectorClass} aria-label="Document settings inspector">
      <header className="flex min-w-0 items-start justify-between gap-2">
        <div className="flex min-w-0 flex-auto items-start gap-2">
          <span className={docChipClass} aria-hidden="true">
            Doc
          </span>
          <div>
            <h2 className={inspectorTitleClass}>Document settings</h2>
            <p className="mt-0.5 mb-0 break-words text-xs text-stone-500">
              Changes apply to the whole template.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-2" aria-label="Document settings sections">
        <section className={inspectorSectionClass}>
          <h3 className={inspectorSectionHeadingClass}>Page setup</h3>
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
        </section>

        <section className={inspectorSectionClass}>
          <SpacingControls scope="page" template={template} onChangeTemplate={onChangeTemplate} />
        </section>

        <section className={inspectorSectionClass}>
          <h3 className={inspectorSectionHeadingClass}>Footer</h3>
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
        </section>

        <section className={inspectorSectionClass}>
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
