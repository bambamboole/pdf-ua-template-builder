export interface PdfPaneProps {
  pdfUrl: string | null;
  error: string | null;
  loading: boolean;
  onRender?: () => void;
  renderDisabled?: boolean;
}

export function PdfPane({ pdfUrl, error, loading, onRender, renderDisabled }: PdfPaneProps) {
  const status: "ready" | "rendering" | "empty" = loading
    ? "rendering"
    : pdfUrl
      ? "ready"
      : "empty";
  const statusLabel = status === "rendering" ? "Rendering…" : status === "ready" ? "Ready" : "Idle";

  return (
    <aside className="pdf-pane" aria-label="PDF preview">
      <header className="pdf-pane__header">
        <h2>PDF Preview</h2>
        <span className="pdf-pane__status-pill" data-status={status}>
          {statusLabel}
        </span>
      </header>

      {error ? <p className="pdf-pane__error">{error}</p> : null}

      <div className="pdf-pane__body">
        {pdfUrl ? (
          <object data={pdfUrl} type="application/pdf" className="pdf-pane__object">
            <a href={pdfUrl} target="_blank" rel="noreferrer" download="template-preview.pdf">
              Open PDF
            </a>
          </object>
        ) : (
          <div className="pdf-pane__empty">
            {loading
              ? "Rendering the latest template…"
              : "Render the template to preview the PDF here."}
          </div>
        )}
      </div>

      <footer className="pdf-pane__footer">
        {pdfUrl ? (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            download="template-preview.pdf"
            className="builder-button builder-button--ghost"
          >
            ⤓ Download
          </a>
        ) : (
          <span />
        )}
        {onRender ? (
          <button
            type="button"
            className="builder-button"
            onClick={onRender}
            disabled={renderDisabled}
          >
            {loading ? "Rendering…" : pdfUrl ? "Re-render" : "Render PDF"}
          </button>
        ) : null}
      </footer>
    </aside>
  );
}
