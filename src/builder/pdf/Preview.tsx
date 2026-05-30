import { useTemplateBuilder } from "../context/BuilderContext";
import { PdfPane } from "./PdfPane";

export interface PreviewProps {
  className?: string;
}

export function Preview({ className }: PreviewProps = {}) {
  const { pdfUrl, error, pdfLoading, serializedTemplate, data } = useTemplateBuilder();

  return (
    <PdfPane
      className={className}
      pdfUrl={pdfUrl}
      error={error}
      loading={pdfLoading}
      template={serializedTemplate}
      data={data}
    />
  );
}
