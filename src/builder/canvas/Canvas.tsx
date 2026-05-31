import { useBuilderActions, useBuilderState } from "../context/BuilderContext";
import { BuilderCanvas } from "./BuilderCanvas";

export interface CanvasProps {
  className?: string;
}

export function Canvas({ className }: CanvasProps = {}) {
  const {
    schema,
    schemaLoading,
    model,
    data,
    pageSize,
    footerRepeat,
    pageNumbers,
    selectedBlockUid,
  } = useBuilderState();
  const {
    removeBlock,
    selectBlock,
    changeBlock,
    deselect,
    setRowWidths,
    toggleFooterRepeat,
    changePageNumbers,
  } = useBuilderActions();

  if (!schema) {
    return (
      <div
        className={`min-w-0 min-h-0 overflow-auto bg-canvas px-4 pb-8 pt-6${className ? ` ${className}` : ""}`}
      >
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
