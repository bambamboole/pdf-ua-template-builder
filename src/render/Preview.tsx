import { PdfPane } from "./PdfPane";
import { useRenderContext } from "./RenderContext";

export interface PreviewProps {
  className?: string;
}

export function Preview({ className }: PreviewProps = {}) {
  const { template, data, pdfUrl, pdfLoading, error, renderPdf, renderDisabled } =
    useRenderContext();

  return (
    <PdfPane
      className={className}
      pdfUrl={pdfUrl}
      error={error}
      loading={pdfLoading}
      template={template ?? undefined}
      data={data}
      onRender={renderPdf}
      renderDisabled={renderDisabled}
    />
  );
}
