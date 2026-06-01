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
import type { Template } from "../types/generated/template";
import type { TemplateData, TemplateSchemaResponse } from "../types/template";
import { RenderProvider, type RenderContextValue } from "../render/RenderContext";
import { usePdfUaApi } from "../render/usePdfUaApi";
import { parseTemplate } from "./parseTemplate";

export interface TemplateEditorProviderProps {
  apiUrl?: string;
  initialTemplate?: Template;
  data?: TemplateData;
  onChange?: (template: Template | null, text: string) => void;
  onRendered?: (pdf: Blob) => void;
  children: ReactNode;
}

export interface TemplateEditorContextValue {
  text: string;
  setText: (text: string) => void;
  template: Template | null;
  error: string | null;
  data: TemplateData;
  /** Validation schema fetched from the backend `/schema`; null until it loads. */
  schema: TemplateSchemaResponse | null;
}

const emptyTemplate: Template = { version: 1 };
const emptyData: TemplateData = {};

const TemplateEditorContext = createContext<TemplateEditorContextValue | null>(null);

export function useTemplateEditor(): TemplateEditorContextValue {
  const value = useContext(TemplateEditorContext);

  if (!value) {
    throw new Error("useTemplateEditor must be used within a <TemplateEditorProvider>.");
  }

  return value;
}

export function TemplateEditorProvider({
  apiUrl: apiUrlProp,
  initialTemplate,
  data = emptyData,
  onChange,
  onRendered,
  children,
}: TemplateEditorProviderProps) {
  const apiUrl = resolveDefaultApiUrl(apiUrlProp);
  const [text, setText] = useState(() =>
    JSON.stringify(initialTemplate ?? emptyTemplate, null, 2),
  );

  const { template, error } = useMemo(() => parseTemplate(text), [text]);

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
    onChangeRef.current?.(template, text);
  }, [text, template]);

  const {
    schema,
    pdfUrl,
    pdfLoading,
    error: renderError,
    renderPdf: renderPdfRequest,
  } = usePdfUaApi({ initialApiUrl: apiUrl, apiUrl, onRendered });

  const templateRef = useRef(template);
  templateRef.current = template;
  const dataRef = useRef(data);
  dataRef.current = data;

  const renderPdf = useCallback(() => {
    if (templateRef.current) {
      void renderPdfRequest(templateRef.current, dataRef.current);
    }
  }, [renderPdfRequest]);

  const editorValue = useMemo<TemplateEditorContextValue>(
    () => ({ text, setText, template, error, data, schema }),
    [text, template, error, data, schema],
  );

  const renderValue = useMemo<RenderContextValue>(
    () => ({
      template,
      data,
      pdfUrl,
      pdfLoading,
      error: renderError,
      renderPdf,
      renderDisabled: template === null || pdfLoading,
    }),
    [template, data, pdfUrl, pdfLoading, renderError, renderPdf],
  );

  return (
    <TemplateEditorContext.Provider value={editorValue}>
      <RenderProvider value={renderValue}>{children}</RenderProvider>
    </TemplateEditorContext.Provider>
  );
}
