import { useCallback, useEffect, useRef, useState } from "react";
import { renderHtmlPreview } from "../api/pdfUaApi";
import type { PdfValidationResponse } from "../types/template";

interface UseHtmlPreviewOptions {
  apiUrl: string;
  baseUrl?: string;
  onRendered?: (pdf: Blob) => void;
}

interface HtmlPreview {
  pdfUrl: string | null;
  validation: PdfValidationResponse | null;
  loading: boolean;
  error: string | null;
  render: (html: string) => Promise<void>;
}

export function useHtmlPreview({ apiUrl, baseUrl, onRendered }: UseHtmlPreviewOptions): HtmlPreview {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [validation, setValidation] = useState<PdfValidationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const render = useCallback(
    async (html: string) => {
      const requestId = renderRequestId.current + 1;
      renderRequestId.current = requestId;
      setLoading(true);
      setError(null);
      setValidation(null);

      try {
        const result = await renderHtmlPreview(apiUrl, { html, baseUrl });
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
          setLoading(false);
        }
      }
    },
    [apiUrl, baseUrl],
  );

  return { pdfUrl, validation, loading, error, render };
}

function revokeObjectUrl(url: string | null): void {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}
