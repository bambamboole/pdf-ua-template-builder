import { useTemplateBuilderContext } from "../context/TemplateBuilderContext";
import { BuilderCanvas, canvasRegionClass } from "../canvas/BuilderCanvas";

export interface TemplateBuilderCanvasProps {
  className?: string;
}

export function TemplateBuilderCanvas({ className }: TemplateBuilderCanvasProps = {}) {
  const {
    schema,
    schemaLoading,
    model,
    data,
    pageSize,
    footerRepeat,
    pageNumbers,
    selectedBlockUid,
    removeBlock,
    selectBlock,
    changeBlock,
    deselect,
    setRowWidths,
    toggleFooterRepeat,
    changePageNumbers,
  } = useTemplateBuilderContext();

  if (!schema) {
    return (
      <div className={className ? `${canvasRegionClass} ${className}` : canvasRegionClass}>
        <div className="grid h-full place-items-center text-sm text-fg-muted">
          {schemaLoading ? "Loading schema…" : "Load the schema to start building."}
        </div>
      </div>
    );
  }

  return (
    <BuilderCanvas
      className={className}
      model={model}
      data={data}
      format={pageSize.format}
      orientation={pageSize.orientation}
      footerRepeat={footerRepeat}
      pageNumbers={pageNumbers}
      selectedBlockUid={selectedBlockUid}
      onRemoveBlock={removeBlock}
      onSelectBlock={selectBlock}
      onChangeBlock={changeBlock}
      onDeselect={deselect}
      onSetRowWidths={setRowWidths}
      onToggleFooterRepeat={toggleFooterRepeat}
      onChangePageNumbers={changePageNumbers}
    />
  );
}
