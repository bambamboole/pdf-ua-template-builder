import { PdfPane } from "../render/PdfPane";
import { useHtmlEditor } from "./HtmlEditorContext";

export interface HtmlPreviewProps {
  className?: string;
}

export function HtmlPreview({ className }: HtmlPreviewProps = {}) {
  const { pdfUrl, validation, pdfLoading, error, renderPdf, renderDisabled } = useHtmlEditor();

  return (
    <PdfPane
      className={className}
      pdfUrl={pdfUrl}
      validation={validation}
      error={error}
      loading={pdfLoading}
      loadingLabel="Rendering the latest HTML…"
      emptyLabel="Render the HTML to preview the PDF here."
      onRender={renderPdf}
      renderDisabled={renderDisabled}
    />
  );
}
