import type {
  Align,
  Block,
  CustomPageSize,
  Orientation,
  PageConfig,
  PageFooterConfig,
  PageFormat,
  PageNumbersConfig,
  PageSize,
  PresetPageSize,
  Row,
  Template,
  TemplateConfig,
} from "../../types/generated/template";

export type EditorArea = "body" | "footer";

export type PageNumbersValue = "disabled" | Align;

export interface ResolvedPageSize {
  format: PageFormat;
  orientation: Orientation;
  custom: CustomPageSize | null;
}

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
  footerRows: EditorRow[];
}

let nextUid = 1;

export function createEditorModel(template: Template): EditorModel {
  const { rows = [], ...templateFields } = template;
  const footerRows = templateFields.config?.page?.footer?.rows ?? [];
  const strippedTemplate = stripFooterRows(cloneValue(templateFields));

  return {
    template: strippedTemplate,
    rows: rows.map((row) => createEditorRow(row)),
    footerRows: footerRows.map((row) => createEditorRow(row)),
  };
}

export function serializeTemplate(model: EditorModel): Template {
  const template = cloneValue(model.template) as Template;
  const withFooter = applyFooterRows(template, model.footerRows);

  if (model.rows.length === 0) {
    return withFooter;
  }

  return {
    ...withFooter,
    rows: model.rows.map((row) => ({
      blocks: row.blocks.map((editorBlock) => cloneBlock(editorBlock.block)),
    })),
  };
}

export function addBlockToNewRow(
  model: EditorModel,
  block: Block,
  area: EditorArea = "body",
): EditorModel {
  return updateArea(model, area, (rows) => [
    ...rows,
    { uid: createUid("row"), blocks: [createEditorBlock(block)] },
  ]);
}

export function addBlockToRow(
  model: EditorModel,
  rowUid: string,
  block: Block,
  index: number,
): EditorModel {
  const area = findRowArea(model, rowUid);

  if (!area) {
    return model;
  }

  return updateArea(model, area, (rows) =>
    rows.map((row) =>
      row.uid === rowUid
        ? { ...row, blocks: insertAt(row.blocks, createEditorBlock(block), index) }
        : row,
    ),
  );
}

export function removeBlock(model: EditorModel, blockUid: string): EditorModel {
  return mapAllAreas(model, (rows) =>
    rows
      .map((row) => ({
        ...row,
        blocks: row.blocks.filter((block) => block.uid !== blockUid),
      }))
      .filter((row) => row.blocks.length > 0),
  );
}

export function moveBlock(
  model: EditorModel,
  blockUid: string,
  rowUid: string | null,
  index: number,
  area: EditorArea = "body",
): EditorModel {
  const block = findEditorBlock(model, blockUid);

  if (!block) {
    return model;
  }

  if (rowUid === null) {
    const stripped = mapAllAreas(model, (rows) =>
      rows
        .map((row) => ({
          ...row,
          blocks: row.blocks.filter((candidate) => candidate.uid !== blockUid),
        }))
        .filter((row) => row.blocks.length > 0),
    );

    return updateArea(stripped, area, (rows) => [
      ...rows,
      { uid: createUid("row"), blocks: [block] },
    ]);
  }

  const targetArea = findRowArea(model, rowUid);

  if (!targetArea) {
    return model;
  }

  const stripped = mapAllAreas(model, (rows) =>
    rows.map((row) => ({
      ...row,
      blocks: row.blocks.filter((candidate) => candidate.uid !== blockUid),
    })),
  );

  const withInsert = updateArea(stripped, targetArea, (rows) =>
    rows.map((row) =>
      row.uid === rowUid ? { ...row, blocks: insertAt(row.blocks, block, index) } : row,
    ),
  );

  return mapAllAreas(withInsert, (rows) => rows.filter((row) => row.blocks.length > 0));
}

export function moveRow(model: EditorModel, rowUid: string, index: number): EditorModel {
  const area = findRowArea(model, rowUid);

  if (!area) {
    return model;
  }

  return updateArea(model, area, (rows) => {
    const row = rows.find((candidate) => candidate.uid === rowUid);

    if (!row) {
      return rows;
    }

    const remaining = rows.filter((candidate) => candidate.uid !== rowUid);

    return insertAt(remaining, row, index);
  });
}

export function updateBlock(model: EditorModel, blockUid: string, block: Block): EditorModel {
  return mapAllAreas(model, (rows) =>
    rows.map((row) => ({
      ...row,
      blocks: row.blocks.map((editorBlock) =>
        editorBlock.uid === blockUid ? { ...editorBlock, block: cloneBlock(block) } : editorBlock,
      ),
    })),
  );
}

export function updateTemplateSettings(model: EditorModel, template: Template): EditorModel {
  return {
    ...model,
    template: createEditorModel(template).template,
  };
}

export function getPageSize(model: EditorModel): ResolvedPageSize {
  const size = model.template.config?.page?.size;

  if (isCustomPageSize(size)) {
    return { format: "A4", orientation: "portrait", custom: size };
  }

  return {
    format: (size?.format ?? "A4") as PageFormat,
    orientation: (size?.orientation ?? "portrait") as Orientation,
    custom: null,
  };
}

export function setPageSize(
  model: EditorModel,
  format: PageFormat,
  orientation: Orientation,
): EditorModel {
  const nextSize: PresetPageSize = { format, orientation };
  const previousConfig = model.template.config ?? {};
  const previousPage = previousConfig.page ?? {};
  const nextPage: PageConfig = { ...previousPage, size: nextSize };
  const nextConfig: TemplateConfig = { ...previousConfig, page: nextPage };

  return {
    ...model,
    template: { ...model.template, config: nextConfig },
  };
}

function isCustomPageSize(size: PageSize | undefined): size is CustomPageSize {
  return (
    typeof size === "object" &&
    size !== null &&
    "width" in size &&
    "height" in size &&
    typeof (size as CustomPageSize).width === "number" &&
    typeof (size as CustomPageSize).height === "number"
  );
}

export function setRowWidths(model: EditorModel, rowUid: string, widths: string[]): EditorModel {
  const area = findRowArea(model, rowUid);

  if (!area) {
    return model;
  }

  return updateArea(model, area, (rows) =>
    rows.map((row) =>
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
  );
}

export function getFooterRepeat(model: EditorModel): boolean {
  return model.template.config?.page?.footer?.repeat !== false;
}

export function setFooterRepeat(model: EditorModel, repeat: boolean): EditorModel {
  return updatePageConfig(model, (page) => {
    const nextFooter: PageFooterConfig = { ...page.footer, repeat };

    return { ...page, footer: nextFooter };
  });
}

export function getPageNumbers(model: EditorModel): PageNumbersValue {
  const pageNumbers = model.template.config?.page?.pageNumbers;

  if (pageNumbers?.enabled !== true) {
    return "disabled";
  }

  return (pageNumbers.position ?? "center") as Align;
}

export function setPageNumbers(model: EditorModel, value: PageNumbersValue): EditorModel {
  return updatePageConfig(model, (page) => {
    if (value === "disabled") {
      const next: PageNumbersConfig = { ...page.pageNumbers, enabled: false };

      return { ...page, pageNumbers: next };
    }

    const next: PageNumbersConfig = { enabled: true, position: value };

    return { ...page, pageNumbers: next };
  });
}

function updatePageConfig(
  model: EditorModel,
  updater: (page: PageConfig) => PageConfig,
): EditorModel {
  const previousConfig = model.template.config ?? {};
  const previousPage = previousConfig.page ?? {};
  const nextPage = updater(previousPage);
  const nextConfig: TemplateConfig = { ...previousConfig, page: nextPage };

  return { ...model, template: { ...model.template, config: nextConfig } };
}

function findRowArea(model: EditorModel, rowUid: string): EditorArea | null {
  if (model.rows.some((row) => row.uid === rowUid)) {
    return "body";
  }
  if (model.footerRows.some((row) => row.uid === rowUid)) {
    return "footer";
  }
  return null;
}

function updateArea(
  model: EditorModel,
  area: EditorArea,
  updater: (rows: EditorRow[]) => EditorRow[],
): EditorModel {
  if (area === "body") {
    return { ...model, rows: updater(model.rows) };
  }
  return { ...model, footerRows: updater(model.footerRows) };
}

function mapAllAreas(
  model: EditorModel,
  updater: (rows: EditorRow[]) => EditorRow[],
): EditorModel {
  return {
    ...model,
    rows: updater(model.rows),
    footerRows: updater(model.footerRows),
  };
}

function stripFooterRows(template: Omit<Template, "rows">): Omit<Template, "rows"> {
  const footer = template.config?.page?.footer;

  if (!footer) {
    return template;
  }

  const { rows: _strippedRows, ...rest } = footer;
  const nextFooter = Object.keys(rest).length === 0 ? undefined : rest;
  const nextPage = { ...template.config?.page, footer: nextFooter };

  if (nextPage.footer === undefined) {
    delete nextPage.footer;
  }

  return {
    ...template,
    config: { ...template.config, page: nextPage },
  };
}

function applyFooterRows(template: Template, footerRows: EditorRow[]): Template {
  const existingPage = template.config?.page ?? {};
  const existingFooter = existingPage.footer ?? {};
  const hasFooterContext =
    footerRows.length > 0 || existingFooter.repeat !== undefined;

  if (!hasFooterContext) {
    return template;
  }

  const serializedRows: Row[] = footerRows.map((row) => ({
    blocks: row.blocks.map((editorBlock) => cloneBlock(editorBlock.block)),
  }));
  const nextFooter: PageFooterConfig = {
    ...existingFooter,
    ...(serializedRows.length > 0 ? { rows: serializedRows } : {}),
  };
  const nextPage: PageConfig = { ...existingPage, footer: nextFooter };

  return { ...template, config: { ...template.config, page: nextPage } };
}

function createEditorRow(row: Row): EditorRow {
  return {
    uid: createUid("row"),
    blocks: row.blocks.map((block) => createEditorBlock(block)),
  };
}

function createEditorBlock(block: Block): EditorBlock {
  return {
    uid: createUid("block"),
    block: cloneBlock(block),
  };
}

export function findEditorBlock(model: EditorModel, blockUid: string): EditorBlock | undefined {
  const allRows = [...model.rows, ...model.footerRows];

  return allRows.flatMap((row) => row.blocks).find((block) => block.uid === blockUid);
}

export function resolveSelectedEditorBlock(
  model: EditorModel,
  blockUid: string | null,
): EditorBlock | null {
  return blockUid ? (findEditorBlock(model, blockUid) ?? null) : null;
}

export function reconcileSelectedBlockUid(
  model: EditorModel,
  blockUid: string | null,
): string | null {
  return resolveSelectedEditorBlock(model, blockUid) ? blockUid : null;
}

export function createNextBlockId(model: EditorModel, blockType: string): string {
  const usedIds = new Set(
    serializeTemplate(model).rows?.flatMap((row) =>
      row.blocks
        .map((block) => block.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ) ?? [],
  );
  let nextId = 1;

  while (usedIds.has(`${blockType}-${nextId}`)) {
    nextId += 1;
  }

  return `${blockType}-${nextId}`;
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
