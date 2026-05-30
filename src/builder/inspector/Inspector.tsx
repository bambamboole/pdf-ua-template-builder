import { useTemplateBuilder } from "../context/BuilderContext";
import { BlockInspector } from "./BlockInspector";
import { DocumentSettingsInspector } from "./DocumentSettingsInspector";

export interface InspectorProps {
  className?: string;
}

export function Inspector({ className }: InspectorProps = {}) {
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
  } = useTemplateBuilder();

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
