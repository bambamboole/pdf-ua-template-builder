import { type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { useCallback, useState, type Dispatch, type RefObject } from "react";
import type { Block } from "../../types/generated/template";
import type { JsonSchemaObject } from "../../types/template";
import { useBuilderSensors } from "../lib/sensors";
import { getDragData } from "../state/dragDrop";
import { findEditorBlock, type EditorModel } from "../state/editorModel";
import type { EditorAction } from "../state/editorReducer";

export type ActiveDrag =
  | { kind: "palette"; type: string }
  | { kind: "block"; block: Block }
  | { kind: "row" }
  | null;

interface BuilderDragDrop {
  activeDrag: ActiveDrag;
  sensors: ReturnType<typeof useBuilderSensors>;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragCancel: () => void;
}

export function useBuilderDragDrop(
  schema: JsonSchemaObject | null,
  dispatch: Dispatch<EditorAction>,
  modelRef: RefObject<EditorModel>,
): BuilderDragDrop {
  const [activeDrag, setActiveDrag] = useState<ActiveDrag>(null);

  const sensors = useBuilderSensors();

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
        const editorBlock = findEditorBlock(modelRef.current, dragData.blockUid);
        setActiveDrag(editorBlock ? { kind: "block", block: editorBlock.block } : null);
      }
    },
    [modelRef],
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
        dispatch({
          type: "dropFromPalette",
          schema,
          blockType: activeData.type,
          overId: event.over.id,
          overData,
        });
        return;
      }

      if (activeData.type === "row" && activeData.rowUid) {
        dispatch({ type: "moveRowTo", rowUid: activeData.rowUid, overId: event.over.id, overData });
        return;
      }

      if (activeData.type === "block" && activeData.blockUid) {
        dispatch({
          type: "moveBlockTo",
          blockUid: activeData.blockUid,
          overId: event.over.id,
          overData,
        });
      }
    },
    [schema, dispatch],
  );

  const onDragCancel = useCallback(() => {
    setActiveDrag(null);
  }, []);

  return { activeDrag, sensors, onDragStart, onDragEnd, onDragCancel };
}
