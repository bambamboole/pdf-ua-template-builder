import type { Block } from "../../types/generated/template";

export interface BlockEditorProps {
  block: Block;
  onChangeBlock: (block: Block) => void;
  rowData?: unknown;
  onChangeRowData?: (data: unknown) => void;
  showLayoutControls?: boolean;
}

export function setBlockConfigValue<TBlock extends Block>(
  block: TBlock,
  key: string,
  value: unknown,
): TBlock {
  const config = { ...(block.config as Record<string, unknown> | undefined) };

  if (value === undefined) {
    delete config[key];
  } else {
    config[key] = value;
  }

  const nextBlock = {
    ...block,
    config: Object.keys(config).length === 0 ? undefined : config,
  } as TBlock;

  if ((nextBlock as { config?: unknown }).config === undefined) {
    delete (nextBlock as { config?: unknown }).config;
  }

  return nextBlock;
}
