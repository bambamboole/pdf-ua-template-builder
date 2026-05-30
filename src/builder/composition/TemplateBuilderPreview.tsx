import { useTemplateBuilderContext } from "../context/TemplateBuilderContext";
import { PdfPane } from "../pdf/PdfPane";

export interface TemplateBuilderPreviewProps {
  className?: string;
}

export function TemplateBuilderPreview({ className }: TemplateBuilderPreviewProps = {}) {
  const { pdfUrl, error, pdfLoading, serializedTemplate, data } = useTemplateBuilderContext();

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
