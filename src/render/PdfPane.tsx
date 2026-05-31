import { useState } from "react";
import type { Template } from "../types/generated/template";
import type { TemplateData } from "../types/template";
import { Button } from "../builder/primitives/Button";
import { PdfView, StatusPill, Tab, deriveStatus, statusLabel } from "./previewChrome";

export type OutputTab = "pdf" | "data";

export interface PdfPaneProps {
  pdfUrl: string | null;
  error: string | null;
  loading: boolean;
  template?: Template;
  data?: TemplateData;
  className?: string;
  onRender?: () => void;
  renderDisabled?: boolean;
}

export function PdfPane({
  pdfUrl,
  error,
  loading,
  template,
  data,
  className,
  onRender,
  renderDisabled,
}: PdfPaneProps) {
  const [tab, setTab] = useState<OutputTab>("pdf");
  const status = deriveStatus(loading, pdfUrl);

  return (
    <aside
      className={`pdfua-template-builder grid min-w-0 min-h-0 grid-rows-[56px_auto_minmax(0,1fr)] bg-canvas${className ? ` ${className}` : ""}`}
      aria-label="Output"
    >
      <header className="row-start-1 flex items-center justify-between gap-3 border-0 border-b border-solid border-border bg-surface px-4">
        <div className="inline-flex h-full items-stretch gap-0.5" role="tablist" aria-label="Output view">
          <Tab active={tab === "pdf"} onClick={() => setTab("pdf")}>
            PDF
          </Tab>
          <Tab active={tab === "data"} onClick={() => setTab("data")}>
            Data
          </Tab>
          {tab === "data" ? <CopyJsonButton template={template} data={data} /> : null}
        </div>
        <div className="flex items-center gap-3">
          <StatusPill status={status}>{statusLabel(status)}</StatusPill>
          {onRender ? (
            <Button variant="primary" onClick={onRender} disabled={renderDisabled}>
              {loading ? "Rendering…" : "Render PDF"}
            </Button>
          ) : null}
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
        {tab === "pdf" ? (
          <PdfView
            pdfUrl={pdfUrl}
            loading={loading}
            loadingLabel="Rendering the latest template…"
            emptyLabel="Render the template to preview the PDF here."
          />
        ) : (
          <DataView template={template} data={data} />
        )}
      </div>
    </aside>
  );
}

function DataView({ template, data }: { template?: Template; data?: TemplateData }) {
  const payload = { template: template ?? null, data: data ?? {} };

  return (
    <pre
      className="h-full w-full min-h-0 rounded-lg border border-solid border-border bg-surface shadow-page m-0 overflow-auto p-4 font-mono text-sm leading-normal text-fg [tab-size:2] whitespace-pre max-[1080px]:h-[34rem]"
    >
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
    <button
      type="button"
      className="m-0 ml-2 h-[26px] cursor-pointer self-center rounded-md border border-solid border-border bg-surface px-3 text-2xs font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
      onClick={handleCopy}
    >
      {copied ? "✓ Copied" : "⧉ Copy JSON"}
    </button>
  );
}
