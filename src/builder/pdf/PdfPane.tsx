import { useState } from "react";
import type { Template } from "../../types/generated/template";
import type { TemplateData } from "../../types/template";

export type OutputTab = "pdf" | "data";

export interface PdfPaneProps {
  pdfUrl: string | null;
  error: string | null;
  loading: boolean;
  template?: Template;
  data?: TemplateData;
  onRender?: () => void;
  renderDisabled?: boolean;
}

export function PdfPane({
  pdfUrl,
  error,
  loading,
  template,
  data,
  onRender,
  renderDisabled,
}: PdfPaneProps) {
  const [tab, setTab] = useState<OutputTab>("pdf");
  const status: "ready" | "rendering" | "empty" = loading
    ? "rendering"
    : pdfUrl
      ? "ready"
      : "empty";
  const statusLabel = status === "rendering" ? "Rendering…" : status === "ready" ? "Ready" : "Idle";

  return (
    <aside className="pdf-pane" aria-label="Output">
      <header className="pdf-pane__header">
        <div className="pdf-pane__tabs" role="tablist" aria-label="Output view">
          <button
            type="button"
            role="tab"
            className="pdf-pane__tab"
            aria-selected={tab === "pdf"}
            data-active={tab === "pdf"}
            onClick={() => setTab("pdf")}
          >
            PDF
          </button>
          <button
            type="button"
            role="tab"
            className="pdf-pane__tab"
            aria-selected={tab === "data"}
            data-active={tab === "data"}
            onClick={() => setTab("data")}
          >
            Data
          </button>
        </div>
        <span className="pdf-pane__status-pill" data-status={status}>
          {statusLabel}
        </span>
      </header>

      {error ? <p className="pdf-pane__error">{error}</p> : null}

      <div className="pdf-pane__body">
        {tab === "pdf" ? (
          <PdfView pdfUrl={pdfUrl} loading={loading} />
        ) : (
          <DataView template={template} data={data} />
        )}
      </div>

      <footer className="pdf-pane__footer">
        {tab === "pdf" && pdfUrl ? (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            download="template-preview.pdf"
            className="builder-button builder-button--ghost"
          >
            ⤓ Download
          </a>
        ) : tab === "data" ? (
          <CopyJsonButton template={template} data={data} />
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

function PdfView({ pdfUrl, loading }: { pdfUrl: string | null; loading: boolean }) {
  if (pdfUrl) {
    return (
      <object data={pdfUrl} type="application/pdf" className="pdf-pane__object">
        <a href={pdfUrl} target="_blank" rel="noreferrer" download="template-preview.pdf">
          Open PDF
        </a>
      </object>
    );
  }
  return (
    <div className="pdf-pane__empty">
      {loading
        ? "Rendering the latest template…"
        : "Render the template to preview the PDF here."}
    </div>
  );
}

function DataView({ template, data }: { template?: Template; data?: TemplateData }) {
  const payload = { template: template ?? null, data: data ?? {} };

  return (
    <pre className="pdf-pane__json">
      <code>{JSON.stringify(payload, null, 2)}</code>
    </pre>
  );
}

function CopyJsonButton({ template, data }: { template?: Template; data?: TemplateData }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const payload = JSON.stringify({ template: template ?? null, data: data ?? {} }, null, 2);

    void navigator.clipboard.writeText(payload).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button type="button" className="builder-button builder-button--ghost" onClick={handleCopy}>
      {copied ? "✓ Copied" : "⧉ Copy JSON"}
    </button>
  );
}
