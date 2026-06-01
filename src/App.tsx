import { lazy, Suspense, useMemo, useState } from "react";
import { createInvoiceExample } from "./builder/schema/invoiceExample";

// Lazy per-tab so each editor's heavy deps load only when its tab is opened:
// the builder pulls dnd-kit, the JSON/HTML editors pull CodeMirror (+ the bundled
// validation schema). Only the active tab's chunk is fetched.
const TemplateBuilder = lazy(() =>
  import("./builder/TemplateBuilder").then((m) => ({ default: m.TemplateBuilder })),
);
const TemplateEditor = lazy(() =>
  import("./editor/TemplateEditor").then((m) => ({ default: m.TemplateEditor })),
);
const HtmlEditor = lazy(() =>
  import("./html-editor/HtmlEditor").then((m) => ({ default: m.HtmlEditor })),
);

type Mode = "builder" | "json" | "html";

const TABS: { id: Mode; label: string }[] = [
  { id: "builder", label: "Template builder" },
  { id: "json", label: "Template editor" },
  { id: "html", label: "HTML editor" },
];

const SAMPLE_INVOICE_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Invoice INV-1001</title>
    <style>
      body {
        font-family: system-ui, sans-serif;
        margin: 2rem;
        color: #1a1a1a;
        line-height: 1.5;
      }
      header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
      }
      h1 {
        font-size: 1.75rem;
        margin: 0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1.5rem;
      }
      th,
      td {
        border-bottom: 1px solid #ddd;
        padding: 0.5rem 0.75rem;
        text-align: left;
      }
      td.amount,
      th.amount {
        text-align: right;
      }
      tfoot td {
        font-weight: 600;
        border-bottom: none;
      }
    </style>
  </head>
  <body>
    <header>
      <h1>Invoice</h1>
      <p>No. INV-1001</p>
    </header>
    <p>Acme GmbH · Musterstraße 1 · 12345 Berlin</p>
    <table>
      <thead>
        <tr>
          <th scope="col">Description</th>
          <th scope="col" class="amount">Qty</th>
          <th scope="col" class="amount">Unit price</th>
          <th scope="col" class="amount">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Consulting services</td>
          <td class="amount">10</td>
          <td class="amount">€120.00</td>
          <td class="amount">€1,200.00</td>
        </tr>
        <tr>
          <td>Implementation</td>
          <td class="amount">5</td>
          <td class="amount">€150.00</td>
          <td class="amount">€750.00</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3">Total</td>
          <td class="amount">€1,950.00</td>
        </tr>
      </tfoot>
    </table>
  </body>
</html>
`;

export default function App() {
  const apiUrl = import.meta.env.VITE_PDF_UA_API_URL;
  const [mode, setMode] = useState<Mode>("builder");
  const invoice = useMemo(() => createInvoiceExample(), []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-app text-fg">
      <header className="flex shrink-0 items-center gap-1 border-0 border-b border-solid border-border bg-surface px-3">
        <div className="flex items-stretch gap-0.5" role="tablist" aria-label="Editor mode">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={mode === tab.id}
              className={`h-10 m-0 cursor-pointer border-0 border-b-2 border-solid bg-transparent px-4 text-sm font-medium tracking-[0.02em] transition-colors hover:text-fg ${
                mode === tab.id ? "border-accent text-fg" : "border-transparent text-fg-muted"
              }`}
              onClick={() => setMode(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-sm text-fg-muted">
              Loading editor…
            </div>
          }
        >
          {mode === "builder" ? (
            <TemplateBuilder
              apiUrl={apiUrl}
              initialTemplate={invoice.template}
              initialData={invoice.data}
              examples={{ Invoice: invoice }}
              className="h-full!"
            />
          ) : mode === "json" ? (
            <TemplateEditor
              apiUrl={apiUrl}
              initialTemplate={invoice.template}
              data={invoice.data}
              className="h-full!"
            />
          ) : (
            <HtmlEditor apiUrl={apiUrl} initialHtml={SAMPLE_INVOICE_HTML} className="h-full!" />
          )}
        </Suspense>
      </div>
    </div>
  );
}
