import { useBuilderActions, useBuilderState } from "../context/BuilderContext";
import { DocumentSettings } from "./DocumentSettings";

export interface PageSettingsProps {
  className?: string;
}

export function PageSettings({ className }: PageSettingsProps = {}) {
  const { schema, serializedTemplate, pageSize } = useBuilderState();
  const { changeTemplateSettings, changeFormat, changeOrientation } = useBuilderActions();

  if (!schema) {
    return null;
  }

  return (
    <DocumentSettings
      className={className}
      template={serializedTemplate}
      metadata={schema["x-pdfUa"]}
      format={pageSize.format}
      orientation={pageSize.orientation}
      onChangeTemplate={changeTemplateSettings}
      onChangeFormat={changeFormat}
      onChangeOrientation={changeOrientation}
    />
  );
}
