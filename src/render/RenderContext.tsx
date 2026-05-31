import { createContext, useContext, type ReactNode } from "react";
import type { Template } from "../types/generated/template";
import type { TemplateData } from "../types/template";

export interface RenderContextValue {
  template: Template | null;
  data: TemplateData;
  pdfUrl: string | null;
  pdfLoading: boolean;
  error: string | null;
  renderPdf: () => void;
  renderDisabled: boolean;
}

const RenderContext = createContext<RenderContextValue | null>(null);

export function RenderProvider({
  value,
  children,
}: {
  value: RenderContextValue;
  children: ReactNode;
}) {
  return <RenderContext.Provider value={value}>{children}</RenderContext.Provider>;
}

export function useRenderContext(): RenderContextValue {
  const value = useContext(RenderContext);

  if (!value) {
    throw new Error("useRenderContext must be used within a render provider.");
  }

  return value;
}
