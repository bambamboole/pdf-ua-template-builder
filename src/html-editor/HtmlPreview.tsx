import { Button } from "../builder/primitives/Button";
import { PdfView, StatusPill, deriveStatus, statusLabel } from "../render/previewChrome";
import { useHtmlEditor } from "./HtmlEditorContext";

export interface HtmlPreviewProps {
  className?: string;
}

export function HtmlPreview({ className }: HtmlPreviewProps = {}) {
  const { pdfUrl, pdfLoading, error, renderPdf, renderDisabled } = useHtmlEditor();
  const status = deriveStatus(pdfLoading, pdfUrl);

  return (
    <aside
      className={`pdfua-template-builder grid min-w-0 min-h-0 grid-rows-[56px_auto_minmax(0,1fr)] bg-canvas${className ? ` ${className}` : ""}`}
      aria-label="Output"
    >
      <header className="row-start-1 flex items-center justify-between gap-3 border-0 border-b border-solid border-border bg-surface px-4">
        <span className="text-sm font-medium tracking-[0.02em] text-fg">PDF preview</span>
        <div className="flex items-center gap-3">
          <StatusPill status={status}>{statusLabel(status)}</StatusPill>
          <Button variant="primary" onClick={renderPdf} disabled={renderDisabled}>
            {pdfLoading ? "Rendering…" : "Render PDF"}
          </Button>
        </div>
      </header>

      {error ? (
        <p
          className="row-start-2 mx-4 mt-3 mb-0 rounded border-0 border-l-[3px] border-solid border-danger bg-danger-soft px-3 py-3 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="row-start-3 grid min-h-0 p-4">
        <PdfView
          pdfUrl={pdfUrl}
          loading={pdfLoading}
          loadingLabel="Rendering the latest HTML…"
          emptyLabel="Render the HTML to preview the PDF here."
        />
      </div>
    </aside>
  );
}
