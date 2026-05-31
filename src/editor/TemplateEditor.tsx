import type { Template } from "../types/generated/template";
import type { TemplateData } from "../types/template";
import { Preview } from "../render/Preview";
import { CodeEditor } from "./CodeEditor";
import { TemplateEditorProvider } from "./TemplateEditorContext";

export interface TemplateEditorProps {
  /** Base URL of a running pdf-ua-api instance. Defaults to "" (relative URLs / proxy). */
  apiUrl?: string;
  /** Template seeded into the editor as pretty-printed JSON on first render. */
  initialTemplate?: Template;
  /** Runtime data keyed by block id, passed through to render. */
  data?: TemplateData;
  /** Fires on every edit; `template` is null while the JSON is invalid. */
  onChange?: (template: Template | null, text: string) => void;
  /** Fires after a successful render with the produced PDF blob. */
  onRendered?: (pdf: Blob) => void;
  /** Optional className appended to the root element. */
  className?: string;
}

function DefaultLayout({ className }: { className?: string }) {
  return (
    <main
      className={`grid h-screen overflow-hidden bg-app text-fg grid-cols-[minmax(40rem,1.55fr)_minmax(28rem,0.95fr)] max-[1080px]:h-auto max-[1080px]:grid-cols-1 max-[1080px]:overflow-visible${className ? ` ${className}` : ""}`}
    >
      <CodeEditor className="border-0 border-r border-solid border-border" />
      <Preview />
    </main>
  );
}

/**
 * All-in-one preset: a JSON template editor and a rendered-PDF preview side by side.
 *
 * For custom layouts, compose directly with `TemplateEditorProvider`, `CodeEditor`,
 * and `Preview`.
 */
export function TemplateEditor({
  apiUrl,
  initialTemplate,
  data,
  onChange,
  onRendered,
  className,
}: TemplateEditorProps = {}) {
  return (
    <TemplateEditorProvider
      apiUrl={apiUrl}
      initialTemplate={initialTemplate}
      data={data}
      onChange={onChange}
      onRendered={onRendered}
    >
      <DefaultLayout className={className} />
    </TemplateEditorProvider>
  );
}
