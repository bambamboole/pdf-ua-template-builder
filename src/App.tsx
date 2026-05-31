import { useMemo, useState } from "react";
import { TemplateBuilder } from "./builder/TemplateBuilder";
import { createInvoiceExample } from "./builder/schema/invoiceExample";
import { TemplateEditor } from "./editor/TemplateEditor";
import { HtmlEditor } from "./html-editor/HtmlEditor";

type Mode = "builder" | "json" | "html";

const TABS: { id: Mode; label: string }[] = [
  { id: "builder", label: "Builder" },
  { id: "json", label: "JSON editor" },
  { id: "html", label: "HTML editor" },
];

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
        {mode === "builder" ? (
          <TemplateBuilder
            apiUrl={apiUrl}
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
          <HtmlEditor apiUrl={apiUrl} className="h-full!" />
        )}
      </div>
    </div>
  );
}
