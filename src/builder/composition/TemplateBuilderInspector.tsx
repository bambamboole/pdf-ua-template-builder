import { useTemplateBuilderContext } from "../context/TemplateBuilderContext";
import { BlockInspector } from "../inspector/BlockInspector";
import { DocumentSettingsInspector } from "../inspector/DocumentSettingsInspector";

export interface TemplateBuilderInspectorProps {
  className?: string;
}

export function TemplateBuilderInspector({ className }: TemplateBuilderInspectorProps = {}) {
  const {
    schema,
    selectedBlock,
    data,
    serializedTemplate,
    pageSize,
    changeBlock,
    changeData,
    removeBlock,
    deselect,
    changeTemplateSettings,
    changeFormat,
    changeOrientation,
  } = useTemplateBuilderContext();

  if (!schema) {
    return null;
  }

  if (selectedBlock) {
    return (
      <BlockInspector
        className={className}
        block={selectedBlock}
        schema={schema}
        data={data}
        onChangeBlock={changeBlock}
        onChangeData={changeData}
        onRemoveBlock={removeBlock}
        onClose={deselect}
      />
    );
  }

  return (
    <DocumentSettingsInspector
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
