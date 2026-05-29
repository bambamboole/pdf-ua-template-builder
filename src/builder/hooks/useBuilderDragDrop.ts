import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import type { Block } from "../../types/generated/template";
import { createDefaultBlock, type JsonSchemaObject } from "../schema/schemaAdapter";
import {
  addBlockToNewRow,
  addBlockToRow,
  createNextBlockId,
  findEditorBlock,
  moveBlock,
  moveRow,
  type EditorModel,
} from "../state/editorModel";
import { getDragData, getDropTarget, getRowIndex } from "../state/dragDrop";

export type ActiveDrag =
  | { kind: "palette"; type: string }
  | { kind: "block"; block: Block }
  | { kind: "row" }
  | null;

interface BuilderDragDrop {
  activeDrag: ActiveDrag;
  sensors: ReturnType<typeof useSensors>;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragCancel: () => void;
}

export function useBuilderDragDrop(
  schema: JsonSchemaObject | null,
  setModel: Dispatch<SetStateAction<EditorModel>>,
): BuilderDragDrop {
  const [activeDrag, setActiveDrag] = useState<ActiveDrag>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      const dragData = getDragData(event.active.data.current);

      if (dragData.source === "palette" && dragData.type) {
        setActiveDrag({ kind: "palette", type: dragData.type });
        return;
      }
      if (dragData.type === "row") {
        setActiveDrag({ kind: "row" });
        return;
      }
      if (dragData.type === "block" && dragData.blockUid) {
        setModel((currentModel) => {
          const editorBlock = findEditorBlock(currentModel, dragData.blockUid ?? "");
          setActiveDrag(editorBlock ? { kind: "block", block: editorBlock.block } : null);
          return currentModel;
        });
      }
    },
    [setModel],
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDrag(null);

      if (!event.over) {
        return;
      }

      const activeData = getDragData(event.active.data.current);
      const overData = getDragData(event.over.data.current);

      if (activeData.source === "palette" && activeData.type && schema) {
        setModel((currentModel) => {
          const target = getDropTarget(currentModel, event.over?.id, overData);
          const block = createDefaultBlock(
            schema,
            activeData.type ?? "",
            createNextBlockId(currentModel, activeData.type ?? ""),
          );

          return target.rowUid === null
            ? addBlockToNewRow(currentModel, block, target.area)
            : addBlockToRow(currentModel, target.rowUid, block, target.index);
        });
        return;
      }

      if (activeData.type === "row" && activeData.rowUid) {
        setModel((currentModel) => {
          const index = getRowIndex(currentModel, event.over?.id, overData);

          return index === null
            ? currentModel
            : moveRow(currentModel, activeData.rowUid ?? "", index);
        });
        return;
      }

      if (activeData.type === "block" && activeData.blockUid) {
        setModel((currentModel) => {
          const target = getDropTarget(currentModel, event.over?.id, overData);

          return moveBlock(
            currentModel,
            activeData.blockUid ?? "",
            target.rowUid,
            target.index,
            target.area,
          );
        });
      }
    },
    [schema, setModel],
  );

  const onDragCancel = useCallback(() => {
    setActiveDrag(null);
  }, []);

  return { activeDrag, sensors, onDragStart, onDragEnd, onDragCancel };
}
