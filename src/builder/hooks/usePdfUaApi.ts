import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTemplateSchema, renderTemplatePdf } from "../../api/pdfUaApi";
import type { Template } from "../../types/generated/template";
import type { TemplateData, TemplateSchemaResponse } from "../../types/template";

interface UsePdfUaApiOptions {
  initialApiUrl: string;
  apiUrl: string;
  onRendered?: (pdf: Blob) => void;
}

interface PdfUaApi {
  schema: TemplateSchemaResponse | null;
  schemaLoading: boolean;
  pdfUrl: string | null;
  pdfLoading: boolean;
  error: string | null;
  loadSchema: (url: string) => Promise<void>;
  renderPdf: (template: Template, data: TemplateData) => Promise<void>;
}

export function usePdfUaApi({ initialApiUrl, apiUrl, onRendered }: UsePdfUaApiOptions): PdfUaApi {
  const [schema, setSchema] = useState<TemplateSchemaResponse | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialApiUrlRef = useRef(initialApiUrl);
  const mounted = useRef(false);
  const schemaRequestId = useRef(0);
  const renderRequestId = useRef(0);
  const pdfUrlRef = useRef<string | null>(null);
  const onRenderedRef = useRef(onRendered);

  useEffect(() => {
    onRenderedRef.current = onRendered;
  }, [onRendered]);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      revokeObjectUrl(pdfUrlRef.current);
      pdfUrlRef.current = null;
    };
  }, []);

  const loadSchema = useCallback(async (url: string) => {
    const requestId = schemaRequestId.current + 1;
    schemaRequestId.current = requestId;
    setSchemaLoading(true);
    setError(null);

    try {
      const nextSchema = await fetchTemplateSchema(url);

      if (mounted.current && requestId === schemaRequestId.current) {
        setSchema(nextSchema);
      }
    } catch (cause) {
      if (mounted.current && requestId === schemaRequestId.current) {
        setError(errorMessage(cause));
      }
    } finally {
      if (mounted.current && requestId === schemaRequestId.current) {
        setSchemaLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadSchema(initialApiUrlRef.current);
  }, [loadSchema]);

  const renderPdf = useCallback(
    async (template: Template, data: TemplateData) => {
      const requestId = renderRequestId.current + 1;
      renderRequestId.current = requestId;
      setPdfLoading(true);
      setError(null);

      try {
        const pdf = await renderTemplatePdf(apiUrl, {
          template,
          data,
          options: { title: "Template Preview" },
        });
        const nextPdfUrl = URL.createObjectURL(pdf);

        if (!mounted.current || requestId !== renderRequestId.current) {
          revokeObjectUrl(nextPdfUrl);
          return;
        }

        setPdfUrl((currentPdfUrl) => {
          revokeObjectUrl(currentPdfUrl);
          pdfUrlRef.current = nextPdfUrl;
          return nextPdfUrl;
        });
        onRenderedRef.current?.(pdf);
      } catch (cause) {
        if (mounted.current && requestId === renderRequestId.current) {
          setError(errorMessage(cause));
        }
      } finally {
        if (mounted.current && requestId === renderRequestId.current) {
          setPdfLoading(false);
        }
      }
    },
    [apiUrl],
  );

  return { schema, schemaLoading, pdfUrl, pdfLoading, error, loadSchema, renderPdf };
}

function revokeObjectUrl(url: string | null): void {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}
