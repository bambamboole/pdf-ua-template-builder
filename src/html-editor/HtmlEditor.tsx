import { HtmlCodeEditor } from "./HtmlCodeEditor";
import { HtmlEditorProvider } from "./HtmlEditorContext";
import { HtmlPreview } from "./HtmlPreview";

export interface HtmlEditorProps {
  /** Base URL of a running pdf-ua-api instance. Defaults to "" (relative URLs / proxy). */
  apiUrl?: string;
  /** Base URL used to resolve relative asset references in the HTML. */
  baseUrl?: string;
  /** HTML seeded into the editor on first render. Defaults to a small accessible document. */
  initialHtml?: string;
  /** Fires on every edit with the current HTML text. */
  onChange?: (html: string) => void;
  /** Fires after a successful render with the produced PDF blob. */
  onRendered?: (pdf: Blob) => void;
  /** Optional className appended to the root element. */
  className?: string;
}

function DefaultLayout({ className }: { className?: string }) {
  return (
    <main
      className={`pdfua-template-builder grid h-screen overflow-hidden bg-app text-fg grid-cols-[minmax(40rem,1.55fr)_minmax(28rem,0.95fr)] max-[1080px]:h-auto max-[1080px]:grid-cols-1 max-[1080px]:overflow-visible${className ? ` ${className}` : ""}`}
    >
      <HtmlCodeEditor className="border-0 border-r border-solid border-border" />
      <HtmlPreview />
    </main>
  );
}

/**
 * All-in-one preset: a raw-HTML editor and a rendered-PDF preview side by side.
 * The preview is produced by the backend `POST /convert` (HTML → PDF/UA) endpoint.
 *
 * For custom layouts, compose directly with `HtmlEditorProvider`, `HtmlCodeEditor`,
 * and `HtmlPreview`.
 */
export function HtmlEditor({
  apiUrl,
  baseUrl,
  initialHtml,
  onChange,
  onRendered,
  className,
}: HtmlEditorProps = {}) {
  return (
    <HtmlEditorProvider
      apiUrl={apiUrl}
      baseUrl={baseUrl}
      initialHtml={initialHtml}
      onChange={onChange}
      onRendered={onRendered}
    >
      <DefaultLayout className={className} />
    </HtmlEditorProvider>
  );
}
