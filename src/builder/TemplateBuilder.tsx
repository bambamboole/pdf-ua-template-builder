import type { Template } from "../types/generated/template";
import type { TemplateData } from "../types/template";
import { Builder } from "./Builder";
import { TemplateBuilderProvider, type TemplateExample } from "./context/BuilderContext";
import { Preview } from "../render/Preview";

export interface TemplateBuilderProps {
  /** Base URL of a running pdf-ua-api instance. Defaults to "" (relative URLs / proxy). */
  apiUrl?: string;
  /** Template loaded into the editor on first render. */
  initialTemplate?: Template;
  /** Runtime data keyed by block id (table rows, dynamic key-value overrides). */
  initialData?: TemplateData;
  /** Loadable examples surfaced in the palette, keyed by display name. */
  examples?: Record<string, TemplateExample>;
  /** Fires whenever the user edits the template or its runtime data. */
  onChange?: (template: Template, data: TemplateData) => void;
  /** Fires after a successful render with the produced PDF blob. */
  onRendered?: (pdf: Blob) => void;
  /** Optional className appended to the root element. */
  className?: string;
}

function DefaultLayout({
  examples,
  className,
}: {
  examples?: Record<string, TemplateExample>;
  className?: string;
}) {
  return (
    <main
      className={`grid h-screen overflow-hidden bg-app text-fg grid-cols-[minmax(40rem,1.55fr)_minmax(28rem,0.95fr)] max-[1080px]:h-auto max-[1080px]:grid-cols-1 max-[1080px]:overflow-visible${className ? ` ${className}` : ""}`}
    >
      <Builder examples={examples} className="border-0 border-r border-solid border-border" />
      <Preview />
    </main>
  );
}

/**
 * All-in-one preset: a provider wrapping a Builder and a Preview side by side.
 *
 * For custom layouts (e.g. preview below the builder), compose the parts
 * directly with `TemplateBuilderProvider`, `Builder`, and `Preview`.
 */
export function TemplateBuilder({
  apiUrl,
  initialTemplate,
  initialData,
  examples,
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
      <DefaultLayout examples={examples} className={className} />
    </TemplateBuilderProvider>
  );
}
