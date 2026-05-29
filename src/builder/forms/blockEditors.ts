import type { Block } from "../../types/generated/template";

export interface BlockEditorProps {
  block: Block;
  onChangeBlock: (block: Block) => void;
  rowData?: unknown;
  onChangeRowData?: (data: unknown) => void;
}
