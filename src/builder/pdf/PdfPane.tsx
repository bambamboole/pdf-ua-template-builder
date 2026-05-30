import { useState, type ReactNode } from "react";
import type { Template } from "../../types/generated/template";
import type { TemplateData } from "../../types/template";

export type OutputTab = "pdf" | "data";

type OutputStatus = "ready" | "rendering" | "empty";

export interface PdfPaneProps {
  pdfUrl: string | null;
  error: string | null;
  loading: boolean;
  template?: Template;
  data?: TemplateData;
  className?: string;
}

const pdfPaneClass = "grid min-w-0 min-h-0 grid-rows-[56px_auto_minmax(0,1fr)] bg-canvas";

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      className={`h-full m-0 cursor-pointer border-0 border-b-2 border-solid bg-transparent px-3 text-sm font-medium tracking-[0.02em] transition-colors hover:text-fg ${active ? "border-fg text-fg" : "border-transparent text-fg-muted"}`}
      aria-selected={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

const statusPillVariantClass: Record<OutputStatus, string> = {
  ready: "bg-success-soft text-success",
  rendering: "bg-accent-soft text-accent",
  empty: "bg-surface-muted text-fg-muted",
};

function StatusPill({ status, children }: { status: OutputStatus; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-2xs font-medium ${statusPillVariantClass[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" aria-hidden="true" />
      {children}
    </span>
  );
}

export function PdfPane({ pdfUrl, error, loading, template, data, className }: PdfPaneProps) {
  const [tab, setTab] = useState<OutputTab>("pdf");
  const status: OutputStatus = loading
    ? "rendering"
    : pdfUrl
      ? "ready"
      : "empty";
  const statusLabel = status === "rendering" ? "Rendering…" : status === "ready" ? "Ready" : "Idle";

  return (
    <aside
      className={className ? `${pdfPaneClass} ${className}` : pdfPaneClass}
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
        <StatusPill status={status}>{statusLabel}</StatusPill>
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
          <PdfView pdfUrl={pdfUrl} loading={loading} />
        ) : (
          <DataView template={template} data={data} />
        )}
      </div>
    </aside>
  );
}

function PdfView({ pdfUrl, loading }: { pdfUrl: string | null; loading: boolean }) {
  if (pdfUrl) {
    return (
      <object
        data={pdfUrl}
        type="application/pdf"
        className="h-full w-full min-h-0 rounded-lg border border-solid border-border bg-surface shadow-page max-[1080px]:h-[34rem]"
      />
    );
  }
  return (
    <div className="grid h-full place-items-center rounded-lg border border-dashed border-border-strong bg-surface p-6 text-center text-sm text-fg-muted max-[1080px]:h-[34rem]">
      {loading
        ? "Rendering the latest template…"
        : "Render the template to preview the PDF here."}
    </div>
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
