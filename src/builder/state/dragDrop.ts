import type { UniqueIdentifier } from "@dnd-kit/core";
import type { EditorArea, EditorModel } from "./editorModel";

export interface DragData {
  source?: string;
  type?: string;
  rowUid?: string;
  blockUid?: string;
  area?: EditorArea;
}

export interface DropTarget {
  rowUid: string | null;
  index: number;
  area: EditorArea;
}

export function getDragData(value: unknown): DragData {
  return isObject(value) ? (value as DragData) : {};
}

export function getDropTarget(
  model: EditorModel,
  overId: UniqueIdentifier | undefined,
  overData: DragData,
): DropTarget {
  if (overId === "new-row") {
    return { rowUid: null, index: 0, area: "body" };
  }
  if (overId === "new-footer-row") {
    return { rowUid: null, index: 0, area: "footer" };
  }

  if (overData.type === "block" && overData.rowUid && overData.blockUid) {
    return {
      rowUid: overData.rowUid,
      index: getBlockIndex(model, overData.blockUid),
      area: overData.area ?? "body",
    };
  }

  if (overData.type === "row" && overData.rowUid) {
    return {
      rowUid: overData.rowUid,
      index: getRowBlockCount(model, overData.rowUid),
      area: overData.area ?? "body",
    };
  }

  return { rowUid: null, index: 0, area: "body" };
}

export function getRowIndex(
  model: EditorModel,
  overId: UniqueIdentifier | undefined,
  overData: DragData,
): number | null {
  const rowUid =
    (overData.type === "row" || overData.type === "block") && overData.rowUid
      ? overData.rowUid
      : String(overId);
  const bodyIndex = model.rows.findIndex((row) => row.uid === rowUid);
  if (bodyIndex !== -1) {
    return bodyIndex;
  }
  const footerIndex = model.footerRows.findIndex((row) => row.uid === rowUid);
  return footerIndex === -1 ? null : footerIndex;
}

function getBlockIndex(model: EditorModel, blockUid: string): number {
  for (const row of [...model.rows, ...model.footerRows]) {
    const index = row.blocks.findIndex((block) => block.uid === blockUid);

    if (index !== -1) {
      return index;
    }
  }

  return 0;
}

function getRowBlockCount(model: EditorModel, rowUid: string): number {
  const row =
    model.rows.find((candidate) => candidate.uid === rowUid) ??
    model.footerRows.find((candidate) => candidate.uid === rowUid);
  return row?.blocks.length ?? 0;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
