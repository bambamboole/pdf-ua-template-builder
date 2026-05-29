import type { UniqueIdentifier } from "@dnd-kit/core";
import type { Block, Orientation, PageFormat, Template } from "../../types/generated/template";
import type { JsonSchemaObject, TemplateData } from "../../types/template";
import { createDefaultBlock } from "../schema/schemaAdapter";
import { getDropTarget, getRowIndex, type DragData } from "./dragDrop";
import {
  addBlockToNewRow,
  addBlockToRow,
  createEditorModel,
  createNextBlockId,
  getPageSize,
  moveBlock,
  moveRow,
  reconcileSelectedBlockUid,
  removeBlock,
  setFooterRepeat,
  setPageNumbers,
  setPageSize,
  setRowWidths,
  updateBlock,
  updateTemplateSettings,
  type EditorModel,
  type PageNumbersValue,
} from "./editorModel";

export interface EditorState {
  model: EditorModel;
  data: TemplateData;
  selectedBlockUid: string | null;
}

export type EditorAction =
  | { type: "selectBlock"; blockUid: string }
  | { type: "deselect" }
  | { type: "changeBlock"; blockUid: string; block: Block }
  | { type: "removeBlock"; blockUid: string }
  | { type: "changeTemplateSettings"; template: Template }
  | { type: "setRowWidths"; rowUid: string; widths: string[] }
  | { type: "addBlock"; schema: JsonSchemaObject; blockType: string }
  | { type: "setFormat"; format: PageFormat }
  | { type: "setOrientation"; orientation: Orientation }
  | { type: "setFooterRepeat"; repeat: boolean }
  | { type: "setPageNumbers"; value: PageNumbersValue }
  | { type: "setData"; data: TemplateData }
  | { type: "loadExample"; template: Template; data: TemplateData }
  | {
      type: "dropFromPalette";
      schema: JsonSchemaObject;
      blockType: string;
      overId?: UniqueIdentifier;
      overData: DragData;
    }
  | { type: "moveRowTo"; rowUid: string; overId?: UniqueIdentifier; overData: DragData }
  | { type: "moveBlockTo"; blockUid: string; overId?: UniqueIdentifier; overData: DragData };

export function createEditorState(template: Template, data: TemplateData): EditorState {
  return { model: createEditorModel(template), data, selectedBlockUid: null };
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "selectBlock":
      return { ...state, selectedBlockUid: action.blockUid };
    case "deselect":
      return { ...state, selectedBlockUid: null };
    case "changeBlock":
      return withModel(state, updateBlock(state.model, action.blockUid, action.block));
    case "removeBlock":
      return withModel(state, removeBlock(state.model, action.blockUid));
    case "changeTemplateSettings":
      return withModel(state, updateTemplateSettings(state.model, action.template));
    case "setRowWidths":
      return withModel(state, setRowWidths(state.model, action.rowUid, action.widths));
    case "addBlock":
      return withModel(state, addBlockToNewRow(state.model, defaultBlock(state.model, action)));
    case "setFormat":
      return withModel(
        state,
        setPageSize(state.model, action.format, getPageSize(state.model).orientation),
      );
    case "setOrientation":
      return withModel(
        state,
        setPageSize(state.model, getPageSize(state.model).format, action.orientation),
      );
    case "setFooterRepeat":
      return withModel(state, setFooterRepeat(state.model, action.repeat));
    case "setPageNumbers":
      return withModel(state, setPageNumbers(state.model, action.value));
    case "setData":
      return { ...state, data: action.data };
    case "loadExample":
      return createEditorState(action.template, action.data);
    case "dropFromPalette": {
      const target = getDropTarget(state.model, action.overId, action.overData);
      const block = defaultBlock(state.model, action);
      const model =
        target.rowUid === null
          ? addBlockToNewRow(state.model, block, target.area)
          : addBlockToRow(state.model, target.rowUid, block, target.index);

      return withModel(state, model);
    }
    case "moveRowTo": {
      const index = getRowIndex(state.model, action.overId, action.overData);

      return index === null ? state : withModel(state, moveRow(state.model, action.rowUid, index));
    }
    case "moveBlockTo": {
      const target = getDropTarget(state.model, action.overId, action.overData);

      return withModel(
        state,
        moveBlock(state.model, action.blockUid, target.rowUid, target.index, target.area),
      );
    }
  }
}

function withModel(state: EditorState, model: EditorModel): EditorState {
  return { ...state, model, selectedBlockUid: reconcileSelectedBlockUid(model, state.selectedBlockUid) };
}

function defaultBlock(
  model: EditorModel,
  action: { schema: JsonSchemaObject; blockType: string },
): Block {
  return createDefaultBlock(action.schema, action.blockType, createNextBlockId(model, action.blockType));
}
