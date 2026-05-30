import { useTemplateBuilder } from "../context/BuilderContext";
import { BuilderTopbar } from "./BuilderTopbar";

export interface ToolbarProps {
  className?: string;
}

export function Toolbar({ className }: ToolbarProps = {}) {
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
  } = useTemplateBuilder();

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
