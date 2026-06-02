import { useState } from "react";
import type { Template } from "../types/generated/template";
import type { PdfValidationResponse, TemplateData } from "../types/template";
import { Button } from "../builder/primitives/Button";
import { PdfView, StatusPill, Tab, deriveStatus, statusLabel } from "./previewChrome";

export type OutputTab = "pdf" | "validation" | "data";

export interface PdfPaneProps {
  pdfUrl: string | null;
  validation?: PdfValidationResponse | null;
  error: string | null;
  loading: boolean;
  template?: Template;
  data?: TemplateData;
  className?: string;
  loadingLabel?: string;
  emptyLabel?: string;
  onRender?: () => void;
  renderDisabled?: boolean;
}

export function PdfPane({
  pdfUrl,
  validation,
  error,
  loading,
  template,
  data,
  className,
  loadingLabel = "Rendering the latest template…",
  emptyLabel = "Render the template to preview the PDF here.",
  onRender,
  renderDisabled,
}: PdfPaneProps) {
  const [tab, setTab] = useState<OutputTab>("pdf");
  const status = deriveStatus(loading, pdfUrl);
  const showDataTab = template !== undefined || data !== undefined;

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
          <Tab active={tab === "validation"} onClick={() => setTab("validation")}>
            Validation
          </Tab>
          {showDataTab ? (
            <>
              <Tab active={tab === "data"} onClick={() => setTab("data")}>
                Data
              </Tab>
              {tab === "data" ? <CopyJsonButton template={template} data={data} /> : null}
            </>
          ) : null}
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
            loadingLabel={loadingLabel}
            emptyLabel={emptyLabel}
          />
        ) : tab === "validation" || !showDataTab ? (
          <ValidationView validation={validation ?? null} loading={loading} />
        ) : (
          <DataView template={template} data={data} />
        )}
      </div>
    </aside>
  );
}

function ValidationView({
  validation,
  loading,
}: {
  validation: PdfValidationResponse | null;
  loading: boolean;
}) {
  if (!validation) {
    return (
      <div className="grid h-full place-items-center rounded-lg border border-dashed border-border-strong bg-surface p-6 text-center text-sm text-fg-muted max-[1080px]:h-[34rem]">
        {loading ? "Validating the rendered PDF…" : "Render the PDF to see validation results here."}
      </div>
    );
  }

  const { summary } = validation;
  const profiles = validation.profiles ?? [];
  const categories = summary.categories ?? [];
  const failures = validation.failures ?? [];

  return (
    <div className="h-full min-h-0 overflow-auto rounded-lg border border-solid border-border bg-surface p-4 text-sm text-fg shadow-page max-[1080px]:h-[34rem]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="m-0 text-base font-semibold text-fg">
            {validation.isCompliant ? "Compliant" : "Issues found"}
          </p>
          <p className="m-0 mt-1 text-xs text-fg-muted">
            {summary.passedChecks} of {summary.totalChecks} checks passed
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-2xs font-medium ${validation.isCompliant ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}
        >
          {summary.failedChecks} failed
        </span>
      </div>

      <section className="mb-4 grid gap-2">
        {profiles.map((profile) => (
          <div
            key={profile.profile}
            className="rounded-md border border-solid border-border bg-canvas px-3 py-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-fg">{profile.profile}</span>
              <span
                className={`text-2xs font-medium ${profile.isCompliant ? "text-success" : "text-danger"}`}
              >
                {profile.failedChecks} failed
              </span>
            </div>
            <p className="m-0 mt-1 text-xs text-fg-muted">{profile.specification}</p>
          </div>
        ))}
      </section>

      {categories.length > 0 ? (
        <section className="mb-4">
          <h3 className="m-0 mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-fg-muted">
            Categories
          </h3>
          <div className="grid gap-1.5">
            {categories.map((category) => (
              <div
                key={category.category}
                className="flex items-center justify-between gap-3 border-0 border-b border-solid border-border py-1.5 last:border-b-0"
              >
                <span className="min-w-0 truncate text-fg">{category.category}</span>
                <span className="shrink-0 text-2xs text-fg-muted">
                  {category.failedChecks} failed / {category.passedChecks} passed
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h3 className="m-0 mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-fg-muted">
          Failures
        </h3>
        {failures.length === 0 ? (
          <p className="m-0 rounded-md bg-success-soft px-3 py-2 text-success">
            No validation failures.
          </p>
        ) : (
          <div className="grid gap-2">
            {failures.map((failure) => (
              <article
                key={`${failure.profile}:${failure.clause}:${failure.testNumber}:${failure.location ?? ""}`}
                className="rounded-md border border-solid border-border bg-canvas p-3"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2 text-2xs text-fg-muted">
                  <span>{failure.profile}</span>
                  <span>{failure.category}</span>
                  <span>{failure.clause}</span>
                </div>
                <p className="m-0 text-sm text-fg">{failure.message}</p>
                {failure.location ? (
                  <p className="m-0 mt-2 font-mono text-2xs text-fg-muted">{failure.location}</p>
                ) : null}
                {failure.errorDetails ? (
                  <p className="m-0 mt-2 text-xs text-fg-muted">{failure.errorDetails}</p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
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
