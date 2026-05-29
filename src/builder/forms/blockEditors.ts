import type { ComponentType } from "react";
import type { Block } from "../../types/generated/template";
import { ImageBlockEditor } from "./ImageBlockEditor";
import { KeyValueBlockEditor } from "./KeyValueBlockEditor";
import { TableBlockEditor } from "./TableBlockEditor";

export interface BlockEditorProps {
  block: Block;
  onChangeBlock: (block: Block) => void;
  rowData?: unknown;
  onChangeRowData?: (data: unknown) => void;
  showLayoutControls?: boolean;
}

export type BlockEditorRegistry = Partial<Record<string, ComponentType<BlockEditorProps>>>;

export const BLOCK_EDITORS: BlockEditorRegistry = {
  image: ImageBlockEditor,
  "key-value": KeyValueBlockEditor,
  table: TableBlockEditor,
};
