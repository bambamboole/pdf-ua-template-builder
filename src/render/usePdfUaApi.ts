import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTemplateSchema, renderTemplatePreview } from "../api/pdfUaApi";
import { errorMessage, revokeObjectUrl } from "../lib/preview";
import type { Template } from "../types/generated/template";
import type { PdfValidationResponse, TemplateData, TemplateSchemaResponse } from "../types/template";

interface UsePdfUaApiOptions {
  initialApiUrl: string;
  apiUrl: string;
  onRendered?: (pdf: Blob) => void;
  loadSchemaOnMount?: boolean;
}

interface PdfUaApi {
  schema: TemplateSchemaResponse | null;
  schemaLoading: boolean;
  pdfUrl: string | null;
  validation: PdfValidationResponse | null;
  pdfLoading: boolean;
  error: string | null;
  loadSchema: (url: string) => Promise<void>;
  renderPdf: (template: Template, data: TemplateData) => Promise<void>;
}

export function usePdfUaApi({
  initialApiUrl,
  apiUrl,
  onRendered,
  loadSchemaOnMount = true,
}: UsePdfUaApiOptions): PdfUaApi {
  const [schema, setSchema] = useState<TemplateSchemaResponse | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [validation, setValidation] = useState<PdfValidationResponse | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialApiUrlRef = useRef(initialApiUrl);
  const schemaRequestId = useRef(0);
  const renderRequestId = useRef(0);
  const pdfUrlRef = useRef<string | null>(null);
  const onRenderedRef = useRef(onRendered);

  useEffect(() => {
    onRenderedRef.current = onRendered;
  }, [onRendered]);

  useEffect(() => {
    return () => {
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

      if (requestId === schemaRequestId.current) {
        setSchema(nextSchema);
      }
    } catch (cause) {
      if (requestId === schemaRequestId.current) {
        setError(errorMessage(cause));
      }
    } finally {
      if (requestId === schemaRequestId.current) {
        setSchemaLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (loadSchemaOnMount) {
      void loadSchema(initialApiUrlRef.current);
    }
  }, [loadSchema, loadSchemaOnMount]);

  const renderPdf = useCallback(
    async (template: Template, data: TemplateData) => {
      const requestId = renderRequestId.current + 1;
      renderRequestId.current = requestId;
      setPdfLoading(true);
      setError(null);
      setValidation(null);

      try {
        const result = await renderTemplatePreview(apiUrl, {
          template,
          data,
        });
        const nextPdfUrl = URL.createObjectURL(result.pdf);

        if (requestId !== renderRequestId.current) {
          revokeObjectUrl(nextPdfUrl);
          return;
        }

        setPdfUrl((currentPdfUrl) => {
          revokeObjectUrl(currentPdfUrl);
          pdfUrlRef.current = nextPdfUrl;
          return nextPdfUrl;
        });
        setValidation(result.validation);
        onRenderedRef.current?.(result.pdf);
      } catch (cause) {
        if (requestId === renderRequestId.current) {
          setError(errorMessage(cause));
        }
      } finally {
        if (requestId === renderRequestId.current) {
          setPdfLoading(false);
        }
      }
    },
    [apiUrl],
  );

  return { schema, schemaLoading, pdfUrl, validation, pdfLoading, error, loadSchema, renderPdf };
}
