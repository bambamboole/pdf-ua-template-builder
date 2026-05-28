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
}

const tabBaseClass =
  "h-full m-0 cursor-pointer border-0 border-b-2 border-solid border-transparent bg-transparent px-3 text-sm font-medium tracking-[0.02em] text-stone-500 transition-colors hover:text-stone-900";

const tabActiveClass = "text-stone-900 border-stone-900";

const statusPillBaseClass =
  "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium";

const statusPillVariantClass: Record<"ready" | "rendering" | "empty", string> = {
  ready: "bg-emerald-100 text-emerald-700",
  rendering: "bg-indigo-50 text-indigo-600",
  empty: "bg-stone-100 text-stone-500",
};

const surfacePanelClass =
  "h-full w-full min-h-0 rounded-lg border border-solid border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.1)]";

export function PdfPane({ pdfUrl, error, loading, template, data }: PdfPaneProps) {
  const [tab, setTab] = useState<OutputTab>("pdf");
  const status: "ready" | "rendering" | "empty" = loading
    ? "rendering"
    : pdfUrl
      ? "ready"
      : "empty";
  const statusLabel = status === "rendering" ? "Rendering…" : status === "ready" ? "Ready" : "Idle";

  return (
    <aside
      className="grid min-w-0 min-h-0 grid-rows-[56px_auto_minmax(0,1fr)] bg-stone-200"
      aria-label="Output"
    >
      <header className="row-start-1 flex items-center justify-between gap-3 border-0 border-b border-solid border-stone-200 bg-white px-4">
        <div className="inline-flex h-full items-stretch gap-0.5" role="tablist" aria-label="Output view">
          <button
            type="button"
            role="tab"
            className={tab === "pdf" ? `${tabBaseClass} ${tabActiveClass}` : tabBaseClass}
            aria-selected={tab === "pdf"}
            onClick={() => setTab("pdf")}
          >
            PDF
          </button>
          <button
            type="button"
            role="tab"
            className={tab === "data" ? `${tabBaseClass} ${tabActiveClass}` : tabBaseClass}
            aria-selected={tab === "data"}
            onClick={() => setTab("data")}
          >
            Data
          </button>
          {tab === "data" ? <CopyJsonButton template={template} data={data} /> : null}
        </div>
        <span className={`${statusPillBaseClass} ${statusPillVariantClass[status]}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" aria-hidden="true" />
          {statusLabel}
        </span>
      </header>

      {error ? (
        <p
          className="row-start-2 mx-4 mt-3 mb-0 rounded border-0 border-l-[3px] border-solid border-red-700 bg-red-50 px-3 py-3 text-sm text-red-700"
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
        className={`${surfacePanelClass} max-[1080px]:h-[34rem]`}
      />
    );
  }
  return (
    <div className="grid h-full place-items-center rounded-lg border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500 max-[1080px]:h-[34rem]">
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
      className={`${surfacePanelClass} m-0 overflow-auto p-4 font-mono text-sm leading-normal text-stone-900 [tab-size:2] whitespace-pre max-[1080px]:h-[34rem]`}
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
      className="m-0 ml-2 h-[26px] cursor-pointer self-center rounded-md border border-solid border-stone-200 bg-white px-3 text-[11px] font-medium text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-900"
      onClick={handleCopy}
    >
      {copied ? "✓ Copied" : "⧉ Copy JSON"}
    </button>
  );
}
