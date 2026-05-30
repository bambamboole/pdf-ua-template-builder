import { useTemplateBuilderContext } from "../context/TemplateBuilderContext";
import { BuilderTopbar } from "../topbar/BuilderTopbar";

export interface TemplateBuilderToolbarProps {
  className?: string;
}

export function TemplateBuilderToolbar({ className }: TemplateBuilderToolbarProps = {}) {
  const {
    pageSize,
    apiUrl,
    setApiUrl,
    loadSchema,
    schemaLoading,
    loadExample,
    schema,
    renderPdf,
    pdfLoading,
    changeFormat,
    changeOrientation,
  } = useTemplateBuilderContext();

  return (
    <BuilderTopbar
      className={className}
      format={pageSize.format}
      orientation={pageSize.orientation}
      onChangeFormat={changeFormat}
      onChangeOrientation={changeOrientation}
      apiUrl={apiUrl}
      onApiUrlChange={setApiUrl}
      onLoadSchema={loadSchema}
      schemaLoading={schemaLoading}
      onLoadExample={loadExample}
      exampleDisabled={!schema}
      onRender={renderPdf}
      renderDisabled={!schema || pdfLoading}
      rendering={pdfLoading}
    />
  );
}
