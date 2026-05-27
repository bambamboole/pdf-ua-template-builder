import type { Block, Template } from "../../types/generated/template";

export interface EditorBlock {
  uid: string;
  block: Block;
}

export interface EditorRow {
  uid: string;
  blocks: EditorBlock[];
}

export interface EditorModel {
  template: Omit<Template, "rows">;
  rows: EditorRow[];
}

let nextUid = 1;

export function createEditorModel(template: Template): EditorModel {
  const { rows = [], ...templateFields } = template;

  return {
    template: cloneValue(templateFields),
    rows: rows.map((row) => ({
      uid: createUid("row"),
      blocks: row.blocks.map((block) => createEditorBlock(block)),
    })),
  };
}

export function serializeTemplate(model: EditorModel): Template {
  const template = cloneValue(model.template) as Template;

  if (model.rows.length === 0) {
    return template;
  }

  return {
    ...template,
    rows: model.rows.map((row) => ({
      blocks: row.blocks.map((editorBlock) => cloneBlock(editorBlock.block)),
    })),
  };
}

export function addBlockToNewRow(model: EditorModel, block: Block): EditorModel {
  return {
    ...model,
    rows: [
      ...model.rows,
      {
        uid: createUid("row"),
        blocks: [createEditorBlock(block)],
      },
    ],
  };
}

export function addBlockToRow(
  model: EditorModel,
  rowUid: string,
  block: Block,
  index: number,
): EditorModel {
  return {
    ...model,
    rows: model.rows.map((row) =>
      row.uid === rowUid
        ? {
            ...row,
            blocks: insertAt(row.blocks, createEditorBlock(block), index),
          }
        : row,
    ),
  };
}

export function removeBlock(model: EditorModel, blockUid: string): EditorModel {
  return {
    ...model,
    rows: model.rows
      .map((row) => ({
        ...row,
        blocks: row.blocks.filter((block) => block.uid !== blockUid),
      }))
      .filter((row) => row.blocks.length > 0),
  };
}

export function moveBlock(
  model: EditorModel,
  blockUid: string,
  rowUid: string | null,
  index: number,
): EditorModel {
  const block = findEditorBlock(model, blockUid);

  if (!block) {
    return model;
  }

  if (rowUid === null) {
    const rowsWithoutBlock = model.rows
      .map((row) => ({
        ...row,
        blocks: row.blocks.filter((candidate) => candidate.uid !== blockUid),
      }))
      .filter((row) => row.blocks.length > 0);

    return {
      ...model,
      rows: [
        ...rowsWithoutBlock,
        {
          uid: createUid("row"),
          blocks: [block],
        },
      ],
    };
  }

  if (!model.rows.some((row) => row.uid === rowUid)) {
    return model;
  }

  return {
    ...model,
    rows: model.rows
      .map((row) => {
        const blocksWithoutMovedBlock = row.blocks.filter(
          (candidate) => candidate.uid !== blockUid,
        );

        return row.uid === rowUid
          ? {
              ...row,
              blocks: insertAt(blocksWithoutMovedBlock, block, index),
            }
          : {
              ...row,
              blocks: blocksWithoutMovedBlock,
            };
      })
      .filter((row) => row.blocks.length > 0),
  };
}

export function moveRow(model: EditorModel, rowUid: string, index: number): EditorModel {
  const row = model.rows.find((candidate) => candidate.uid === rowUid);

  if (!row) {
    return model;
  }

  const remainingRows = model.rows.filter((candidate) => candidate.uid !== rowUid);

  return {
    ...model,
    rows: insertAt(remainingRows, row, index),
  };
}

export function updateBlock(model: EditorModel, blockUid: string, block: Block): EditorModel {
  return {
    ...model,
    rows: model.rows.map((row) => ({
      ...row,
      blocks: row.blocks.map((editorBlock) =>
        editorBlock.uid === blockUid ? { ...editorBlock, block: cloneBlock(block) } : editorBlock,
      ),
    })),
  };
}

export function setRowWidths(model: EditorModel, rowUid: string, widths: string[]): EditorModel {
  return {
    ...model,
    rows: model.rows.map((row) =>
      row.uid === rowUid
        ? {
            ...row,
            blocks: row.blocks.map((editorBlock, index) => ({
              ...editorBlock,
              block: setBlockWidth(editorBlock.block, widths[index]),
            })),
          }
        : row,
    ),
  };
}

function createEditorBlock(block: Block): EditorBlock {
  return {
    uid: createUid("block"),
    block: cloneBlock(block),
  };
}

function findEditorBlock(model: EditorModel, blockUid: string): EditorBlock | undefined {
  return model.rows.flatMap((row) => row.blocks).find((block) => block.uid === blockUid);
}

function setBlockWidth(block: Block, width: string | undefined): Block {
  return {
    ...cloneBlock(block),
    config: {
      ...block.config,
      width,
    },
  } as Block;
}

function insertAt<T>(items: readonly T[], item: T, index: number): T[] {
  const nextItems = [...items];
  const safeIndex = Math.max(0, Math.min(index, nextItems.length));

  nextItems.splice(safeIndex, 0, item);

  return nextItems;
}

function cloneBlock(block: Block): Block {
  return cloneValue(block);
}

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

function createUid(prefix: string): string {
  const uid = `${prefix}-${nextUid}`;
  nextUid += 1;

  return uid;
}
