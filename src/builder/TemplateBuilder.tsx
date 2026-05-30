import type { Template } from "../types/generated/template";
import type { TemplateData } from "../types/template";
import { DefaultBuilderLayout } from "./composition/DefaultBuilderLayout";
import { TemplateBuilderProvider } from "./context/TemplateBuilderContext";

export interface TemplateBuilderProps {
  /** Base URL of a running pdf-ua-api instance. Defaults to "" (relative URLs / proxy). */
  apiUrl?: string;
  /** Template loaded into the editor on first render. */
  initialTemplate?: Template;
  /** Runtime data keyed by block id (table rows, dynamic key-value overrides). */
  initialData?: TemplateData;
  /** Fires whenever the user edits the template or its runtime data. */
  onChange?: (template: Template, data: TemplateData) => void;
  /** Fires after a successful render with the produced PDF blob. */
  onRendered?: (pdf: Blob) => void;
  /** Optional className appended to the root element. */
  className?: string;
}

export function TemplateBuilder({
  apiUrl,
  initialTemplate,
  initialData,
  onChange,
  onRendered,
  className,
}: TemplateBuilderProps = {}) {
  return (
    <TemplateBuilderProvider
      apiUrl={apiUrl}
      initialTemplate={initialTemplate}
      initialData={initialData}
      onChange={onChange}
      onRendered={onRendered}
    >
      <DefaultBuilderLayout className={className} />
    </TemplateBuilderProvider>
  );
}
