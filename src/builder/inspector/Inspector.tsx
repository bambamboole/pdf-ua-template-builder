import { useBuilderActions, useBuilderState } from "../context/BuilderContext";
import { BlockInspector } from "./BlockInspector";

// Flyout panel pinned to the right edge of the canvas, shown while a block is selected.
const flyoutClass =
  "absolute inset-y-0 right-0 z-20 w-[min(360px,100%)] border-0 border-l border-solid border-border shadow-pop animate-flyout";

export function Inspector() {
  const { schema, selectedBlock, data } = useBuilderState();
  const { changeBlock, changeData, removeBlock, deselect } = useBuilderActions();

  if (!schema || !selectedBlock) {
    return null;
  }

  return (
    <BlockInspector
      className={flyoutClass}
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
