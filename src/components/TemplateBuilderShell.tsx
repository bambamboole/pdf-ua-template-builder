import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchTemplateSchema, renderTemplatePdf, resolveDefaultApiUrl } from "../api/pdfUaApi";
import { getTemplateSchemaMetadata } from "../types/template";
import type { Template, TemplateSchemaResponse } from "../types/template";

const initialTemplate: Template = {
  version: 1,
  config: {
    page: {
      locale: "en_US",
      margins: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 25,
      },
      pageNumbers: {
        enabled: true,
        position: "center",
      },
    },
    typography: {
      family: "Inter",
      size: 11,
      color: "#111827",
    },
  },
  rows: [
    {
      blocks: [
        {
          type: "text",
          id: "intro",
          text: "Accessible PDF template builder",
          config: {
            typography: {
              size: 18,
              weight: 700,
            },
          },
        },
      ],
    },
    {
      blocks: [
        {
          type: "text",
          id: "body",
          text: "This starter talks directly to pdf-ua-api and will host the ported builder UI.",
        },
      ],
    },
    {
      blocks: [
        {
          type: "divider",
          config: {
            lineColor: "#cbd5e1",
            style: "solid",
            thickness: 1,
          },
        },
      ],
    },
  ],
};

function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function revokeObjectUrl(url: string | null): void {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

export function PdfPreview({ pdfUrl }: { pdfUrl: string | null }) {
  if (!pdfUrl) {
    return <div className="empty-preview" />;
  }

  return (
    <div className="pdf-preview">
      {/* eslint-disable-next-line react/iframe-missing-sandbox -- Chromium blocks blob PDF previews inside sandboxed iframes. */}
      <iframe title="Rendered PDF preview" src={pdfUrl} />
      <a href={pdfUrl} target="_blank" rel="noreferrer" download="template-preview.pdf">
        Open PDF
      </a>
    </div>
  );
}

export function TemplateBuilderShell() {
  const defaultApiUrl = resolveDefaultApiUrl(import.meta.env.VITE_PDF_UA_API_URL);
  const [apiUrl, setApiUrl] = useState(defaultApiUrl);
  const [templateText, setTemplateText] = useState(() => prettyJson(initialTemplate));
  const [schema, setSchema] = useState<TemplateSchemaResponse | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState<string | null>(null);

  const template = useMemo(() => JSON.parse(templateText) as Template, [templateText]);
  const schemaMetadata = schema ? getTemplateSchemaMetadata(schema) : null;

  useEffect(() => () => revokeObjectUrl(pdfUrl), [pdfUrl]);

  const loadSchema = useCallback(async () => {
    setStatus("Loading schema");
    setError(null);

    try {
      setSchema(await fetchTemplateSchema(apiUrl));
      setStatus("Schema loaded");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setStatus("Schema failed");
    }
  }, [apiUrl]);

  const renderPdf = useCallback(async () => {
    setStatus("Rendering PDF");
    setError(null);

    try {
      const pdf = await renderTemplatePdf(apiUrl, {
        template,
        options: {
          title: "Template Builder Preview",
        },
      });
      const nextPdfUrl = URL.createObjectURL(pdf);
      setPdfUrl((currentPdfUrl) => {
        revokeObjectUrl(currentPdfUrl);
        return nextPdfUrl;
      });
      setStatus("PDF rendered");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setStatus("Render failed");
    }
  }, [apiUrl, template]);

  return (
    <main className="builder-shell">
      <section className="toolbar" aria-label="API controls">
        <label>
          API URL
          <input value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} />
        </label>
        <button type="button" onClick={loadSchema}>
          Load schema
        </button>
        <button type="button" onClick={renderPdf}>
          Render PDF
        </button>
        <output>{status}</output>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="workspace">
        <div className="editor-pane">
          <div className="pane-header">
            <h1>Template</h1>
            <span>version {template.version}</span>
          </div>
          <textarea
            aria-label="Template JSON"
            spellCheck={false}
            value={templateText}
            onChange={(event) => setTemplateText(event.target.value)}
          />
        </div>

        <div className="preview-pane">
          <div className="pane-header">
            <h2>API Schema</h2>
            <span>
              {schemaMetadata ? `${schemaMetadata.blockOrder.length} blocks` : "not loaded"}
            </span>
          </div>
          <pre>{schemaMetadata ? prettyJson(schemaMetadata) : "Load /schema from pdf-ua-api."}</pre>

          <div className="pane-header">
            <h2>PDF Preview</h2>
            <span>{pdfUrl ? "ready" : "empty"}</span>
          </div>
          <PdfPreview pdfUrl={pdfUrl} />
        </div>
      </section>
    </main>
  );
}
