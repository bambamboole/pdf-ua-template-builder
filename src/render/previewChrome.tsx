import type { ReactNode } from "react";

export type OutputStatus = "ready" | "rendering" | "empty";

export function deriveStatus(loading: boolean, pdfUrl: string | null): OutputStatus {
  if (loading) return "rendering";
  return pdfUrl ? "ready" : "empty";
}

export function statusLabel(status: OutputStatus): string {
  if (status === "rendering") return "Rendering…";
  return status === "ready" ? "Ready" : "Idle";
}

const statusPillVariantClass: Record<OutputStatus, string> = {
  ready: "bg-success-soft text-success",
  rendering: "bg-accent-soft text-accent",
  empty: "bg-surface-muted text-fg-muted",
};

export function StatusPill({ status, children }: { status: OutputStatus; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-2xs font-medium ${statusPillVariantClass[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" aria-hidden="true" />
      {children}
    </span>
  );
}

export function Tab({
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

export function PdfView({
  pdfUrl,
  loading,
  emptyLabel = "Render the template to preview the PDF here.",
  loadingLabel = "Rendering the latest changes…",
}: {
  pdfUrl: string | null;
  loading: boolean;
  emptyLabel?: string;
  loadingLabel?: string;
}) {
  if (pdfUrl) {
    return (
      <object
        data={pdfUrl}
        type="application/pdf"
        // The rendered PDF is white paper, so its frame stays light in dark mode.
        data-theme="light"
        className="h-full w-full min-h-0 rounded-lg border border-solid border-border bg-page shadow-page max-[1080px]:h-[34rem]"
      />
    );
  }
  return (
    <div
      data-theme="light"
      className="grid h-full place-items-center rounded-lg border border-dashed border-border-strong bg-page p-6 text-center text-sm text-fg-muted max-[1080px]:h-[34rem]"
    >
      {loading ? loadingLabel : emptyLabel}
    </div>
  );
}
