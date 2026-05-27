export interface PdfPaneProps {
  pdfUrl: string | null;
  error: string | null;
  loading: boolean;
}

export function PdfPane({ pdfUrl, error, loading }: PdfPaneProps) {
  const status = loading ? "rendering" : pdfUrl ? "ready" : "empty";

  return (
    <aside className="pdf-pane" aria-label="PDF preview">
      <header className="pdf-pane__header">
        <h2>PDF Preview</h2>
        <span>{status}</span>
      </header>

      {error ? <p className="pdf-pane__error">{error}</p> : null}

      {pdfUrl ? (
        <object data={pdfUrl} type="application/pdf" className="pdf-pane__object">
          <a href={pdfUrl} target="_blank" rel="noreferrer" download="template-preview.pdf">
            Open PDF
          </a>
        </object>
      ) : (
        <div className="pdf-pane__empty">Render PDF to preview the template.</div>
      )}

      {pdfUrl ? (
        <a href={pdfUrl} target="_blank" rel="noreferrer" download="template-preview.pdf">
          Open PDF
        </a>
      ) : null}
    </aside>
  );
}
