import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { resolveDefaultApiUrl } from "../api/pdfUaApi";
import { DEFAULT_HTML } from "./defaultHtml";
import { useHtmlPreview } from "./useHtmlPreview";

export interface HtmlEditorProviderProps {
  /** Base URL of a running pdf-ua-api instance. Defaults to "" (relative URLs / proxy). */
  apiUrl?: string;
  /** Base URL used to resolve relative asset references in the HTML. */
  baseUrl?: string;
  /** HTML seeded into the editor on first render. Defaults to a small accessible document. */
  initialHtml?: string;
  /** Fires on every edit with the current HTML text. */
  onChange?: (html: string) => void;
  /** Fires after a successful render with the produced PDF blob. */
  onRendered?: (pdf: Blob) => void;
  children: ReactNode;
}

export interface HtmlEditorContextValue {
  html: string;
  setHtml: (html: string) => void;
  pdfUrl: string | null;
  pdfLoading: boolean;
  error: string | null;
  renderPdf: () => void;
  renderDisabled: boolean;
}

const HtmlEditorContext = createContext<HtmlEditorContextValue | null>(null);

export function useHtmlEditor(): HtmlEditorContextValue {
  const value = useContext(HtmlEditorContext);

  if (!value) {
    throw new Error("useHtmlEditor must be used within an <HtmlEditorProvider>.");
  }

  return value;
}

export function HtmlEditorProvider({
  apiUrl: apiUrlProp,
  baseUrl,
  initialHtml = DEFAULT_HTML,
  onChange,
  onRendered,
  children,
}: HtmlEditorProviderProps) {
  const apiUrl = resolveDefaultApiUrl(apiUrlProp);
  const [html, setHtml] = useState(initialHtml);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  const skipNextChange = useRef(true);
  useEffect(() => {
    if (skipNextChange.current) {
      skipNextChange.current = false;
      return;
    }
    onChangeRef.current?.(html);
  }, [html]);

  const { pdfUrl, loading, error, render } = useHtmlPreview({ apiUrl, baseUrl, onRendered });

  const htmlRef = useRef(html);
  htmlRef.current = html;

  const renderPdf = useCallback(() => {
    if (htmlRef.current.trim() !== "") {
      void render(htmlRef.current);
    }
  }, [render]);

  const value = useMemo<HtmlEditorContextValue>(
    () => ({
      html,
      setHtml,
      pdfUrl,
      pdfLoading: loading,
      error,
      renderPdf,
      renderDisabled: html.trim() === "" || loading,
    }),
    [html, pdfUrl, loading, error, renderPdf],
  );

  return <HtmlEditorContext.Provider value={value}>{children}</HtmlEditorContext.Provider>;
}
