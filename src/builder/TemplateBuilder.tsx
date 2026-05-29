import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchTemplateSchema, renderTemplatePdf, resolveDefaultApiUrl } from "../api/pdfUaApi";
import type {
  Block,
  Orientation,
  PageFormat,
  Template,
} from "../types/generated/template";
import type { TemplateData, TemplateSchemaResponse } from "../types/template";
import { BlockPalette } from "./blocks/BlockPalette";
import { getBlockSummary } from "./blocks/blockChrome";
import { Chip } from "./primitives/Chip";
import { BlockCardPreview } from "./canvas/BlockCardPreview";
import { BuilderCanvas } from "./canvas/BuilderCanvas";
import { BlockInspector } from "./inspector/BlockInspector";
import { DocumentSettingsInspector } from "./inspector/DocumentSettingsInspector";
import { PdfPane } from "./pdf/PdfPane";
import { createInvoiceExample } from "./schema/invoiceExample";
import {
  createDefaultBlock,
  getBlockTypes,
  type JsonSchemaObject,
} from "./schema/schemaAdapter";
import {
  addBlockToNewRow,
  addBlockToRow,
  createEditorModel,
  getFooterRepeat,
  getPageNumbers,
  getPageSize,
  moveBlock,
  moveRow,
  removeBlock,
  serializeTemplate,
  setFooterRepeat,
  setPageNumbers,
  setPageSize,
  setRowWidths,
  updateTemplateSettings,
  updateBlock,
  type EditorArea,
  type EditorBlock,
  type EditorModel,
  type PageNumbersValue,
} from "./state/editorModel";
import { BuilderTopbar } from "./topbar/BuilderTopbar";

const emptyTemplate: Template = {
  version: 1,
};

export interface TemplateBuilderProps {
  /** Base URL of a running pdf-ua-api instance. Defaults to "" (relative URLs / proxy). */
  apiUrl?: string;
  /** Template loaded into the editor on first render. */
  initialTemplate?: Template;
  /** Runtime data keyed by block id (table rows, dynamic key-value overrides). */
  initialData?: TemplateData;
  /** Fires whenever the user edits the template or its runtime data. */
  onChange?: (template: Template, data: TemplateData) => void;
  /** Fires after a successful render with the produced PDF blob. */
  onRendered?: (pdf: Blob) => void;
  /** Optional className appended to the root element. */
  className?: string;
}

interface DragData {
  source?: string;
  type?: string;
  rowUid?: string;
  blockUid?: string;
  area?: EditorArea;
}

interface DropTarget {
  rowUid: string | null;
  index: number;
  area: EditorArea;
}

type ActiveDrag =
  | { kind: "palette"; type: string }
  | { kind: "block"; block: Block }
  | { kind: "row" }
  | null;

export function TemplateBuilder({
  apiUrl: initialApiUrlProp,
  initialTemplate,
  initialData,
  onChange,
  onRendered,
  className,
}: TemplateBuilderProps = {}) {
  const defaultApiUrl = resolveDefaultApiUrl(initialApiUrlProp);
  const [apiUrl, setApiUrl] = useState(defaultApiUrl);
  const [schema, setSchema] = useState<TemplateSchemaResponse | null>(null);
  const [model, setModel] = useState<EditorModel>(() =>
    createEditorModel(initialTemplate ?? emptyTemplate),
  );
  const [data, setData] = useState<TemplateData>(initialData ?? {});
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag>(null);
  const [selectedBlockUid, setSelectedBlockUid] = useState<string | null>(null);
  const initialApiUrl = useRef(defaultApiUrl);
  const mounted = useRef(false);
  const schemaRequestId = useRef(0);
  const renderRequestId = useRef(0);
  const pdfUrlRef = useRef<string | null>(null);
  const onChangeRef = useRef(onChange);
  const onRenderedRef = useRef(onRendered);
  const skipNextChangeRef = useRef(true);
  useEffect(() => {
    onChangeRef.current = onChange;
    onRenderedRef.current = onRendered;
  }, [onChange, onRendered]);
  useEffect(() => {
    if (skipNextChangeRef.current) {
      skipNextChangeRef.current = false;
      return;
    }
    onChangeRef.current?.(serializeTemplate(model), data);
  }, [model, data]);
  const schemaObject = schema as unknown as JsonSchemaObject | null;
  const blockTypes = useMemo(
    () => (schemaObject ? getBlockTypes(schemaObject) : []),
    [schemaObject],
  );
  const pageSize = getPageSize(model);
  const footerRepeat = getFooterRepeat(model);
  const pageNumbers = getPageNumbers(model);
  const serializedTemplate = useMemo(() => serializeTemplate(model), [model]);
  const selectedBlock = useMemo(
    () => resolveSelectedEditorBlock(model, selectedBlockUid),
    [model, selectedBlockUid],
  );
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      revokeObjectUrl(pdfUrlRef.current);
      pdfUrlRef.current = null;
    };
  }, []);

  const loadSchema = useCallback(async (url: string) => {
    const requestId = schemaRequestId.current + 1;
    schemaRequestId.current = requestId;
    setSchemaLoading(true);
    setError(null);

    try {
      const nextSchema = await fetchTemplateSchema(url);

      if (mounted.current && requestId === schemaRequestId.current) {
        setSchema(nextSchema);
      }
    } catch (cause) {
      if (mounted.current && requestId === schemaRequestId.current) {
        setError(errorMessage(cause));
      }
    } finally {
      if (mounted.current && requestId === schemaRequestId.current) {
        setSchemaLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadSchema(initialApiUrl.current);
  }, [loadSchema]);

  const loadExample = useCallback(() => {
    const example = createInvoiceExample();

    setModel(createEditorModel(example.template));
    setData(example.data);
  }, []);

  const renderPdf = useCallback(async () => {
    const requestId = renderRequestId.current + 1;
    renderRequestId.current = requestId;
    setPdfLoading(true);
    setError(null);

    try {
      const pdf = await renderTemplatePdf(apiUrl, {
        template: serializeTemplate(model),
        data,
        options: {
          title: "Template Preview",
        },
      });
      const nextPdfUrl = URL.createObjectURL(pdf);

      if (!mounted.current || requestId !== renderRequestId.current) {
        revokeObjectUrl(nextPdfUrl);
        return;
      }

      setPdfUrl((currentPdfUrl) => {
        revokeObjectUrl(currentPdfUrl);
        pdfUrlRef.current = nextPdfUrl;
        return nextPdfUrl;
      });
      onRenderedRef.current?.(pdf);
    } catch (cause) {
      if (mounted.current && requestId === renderRequestId.current) {
        setError(errorMessage(cause));
      }
    } finally {
      if (mounted.current && requestId === renderRequestId.current) {
        setPdfLoading(false);
      }
    }
  }, [apiUrl, data, model]);

  const handleChangeBlock = useCallback((blockUid: string, block: Block) => {
    setModel((currentModel) => updateBlock(currentModel, blockUid, block));
  }, []);

  const handleChangeTemplateSettings = useCallback((template: Template) => {
    setModel((currentModel) => updateTemplateSettings(currentModel, template));
  }, []);

  const handleRemoveBlock = useCallback((blockUid: string) => {
    setSelectedBlockUid((currentUid) => (currentUid === blockUid ? null : currentUid));
    setModel((currentModel) => removeBlock(currentModel, blockUid));
  }, []);

  const handleSelectBlock = useCallback((blockUid: string) => {
    setSelectedBlockUid(blockUid);
  }, []);

  const handleCloseInspector = useCallback(() => {
    setSelectedBlockUid(null);
  }, []);

  const handleSetRowWidths = useCallback((rowUid: string, widths: string[]) => {
    setModel((currentModel) => setRowWidths(currentModel, rowUid, widths));
  }, []);

  const handleAddBlock = useCallback(
    (type: string) => {
      if (!schemaObject) {
        return;
      }
      setModel((currentModel) => {
        const block = createDefaultBlock(
          schemaObject,
          type,
          createNextBlockId(currentModel, type),
        );

        return addBlockToNewRow(currentModel, block);
      });
    },
    [schemaObject],
  );

  const handleChangeFormat = useCallback((format: PageFormat) => {
    setModel((currentModel) => {
      const current = getPageSize(currentModel);

      return setPageSize(currentModel, format, current.orientation);
    });
  }, []);

  const handleChangeOrientation = useCallback((orientation: Orientation) => {
    setModel((currentModel) => {
      const current = getPageSize(currentModel);

      return setPageSize(currentModel, current.format, orientation);
    });
  }, []);

  const handleToggleFooterRepeat = useCallback((repeat: boolean) => {
    setModel((currentModel) => setFooterRepeat(currentModel, repeat));
  }, []);

  const handleChangePageNumbers = useCallback((value: PageNumbersValue) => {
    setModel((currentModel) => setPageNumbers(currentModel, value));
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
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
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDrag(null);

      if (!event.over) {
        return;
      }

      const activeData = getDragData(event.active.data.current);
      const overData = getDragData(event.over.data.current);

      if (activeData.source === "palette" && activeData.type && schemaObject) {
        setModel((currentModel) => {
          const target = getDropTarget(currentModel, event.over?.id, overData);
          const block = createDefaultBlock(
            schemaObject,
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
    [schemaObject],
  );

  const handleDragCancel = useCallback(() => {
    setActiveDrag(null);
  }, []);

  useEffect(() => {
    setSelectedBlockUid((currentUid) => reconcileSelectedBlockUid(model, currentUid));
  }, [model]);

  const shellClass =
    "grid h-screen overflow-hidden bg-app text-fg grid-cols-[minmax(40rem,1.55fr)_minmax(28rem,0.95fr)] max-[1080px]:h-auto max-[1080px]:grid-cols-1 max-[1080px]:overflow-visible";
  const rootClassName = className ? `${shellClass} ${className}` : shellClass;

  return (
    <main className={rootClassName}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <section
          className="grid min-w-0 min-h-0 border-0 border-r border-solid border-border bg-app grid-cols-[minmax(320px,360px)_minmax(360px,1fr)] grid-rows-[auto_auto_minmax(0,1fr)] max-[760px]:grid-cols-1"
          aria-label="Template authoring"
        >
          <BuilderTopbar
            format={pageSize.format}
            orientation={pageSize.orientation}
            onChangeFormat={handleChangeFormat}
            onChangeOrientation={handleChangeOrientation}
            apiUrl={apiUrl}
            onApiUrlChange={setApiUrl}
            onLoadSchema={() => void loadSchema(apiUrl)}
            schemaLoading={schemaLoading}
            onLoadExample={loadExample}
            exampleDisabled={!schema}
            onRender={() => void renderPdf()}
            renderDisabled={!schema || pdfLoading}
            rendering={pdfLoading}
          />

          <aside
            className="col-span-full row-start-2 flex min-w-0 items-center overflow-hidden border-0 border-b border-solid border-border bg-surface px-4 py-2 max-[760px]:col-span-1 max-[760px]:row-auto"
            aria-label="Block palette"
          >
            <div className="flex w-full min-w-0 items-center gap-3">
              <h2 className="m-0 flex-none text-2xs font-medium uppercase tracking-[0.06em] text-fg-subtle">
                Blocks
              </h2>
              <BlockPalette blockTypes={blockTypes} onAdd={handleAddBlock} />
            </div>
          </aside>

          {schema ? (
            <BuilderCanvas
              model={model}
              data={data}
              format={pageSize.format}
              orientation={pageSize.orientation}
              footerRepeat={footerRepeat}
              pageNumbers={pageNumbers}
              selectedBlockUid={selectedBlockUid}
              onRemoveBlock={handleRemoveBlock}
              onSelectBlock={handleSelectBlock}
              onChangeBlock={handleChangeBlock}
              onDeselect={handleCloseInspector}
              onSetRowWidths={handleSetRowWidths}
              onToggleFooterRepeat={handleToggleFooterRepeat}
              onChangePageNumbers={handleChangePageNumbers}
            />
          ) : (
            <div className="col-span-full row-start-3 min-w-0 min-h-0 overflow-auto bg-canvas px-4 pb-8 pt-6 max-[760px]:row-auto">
              <div className="grid h-full place-items-center text-sm text-fg-muted">
                {schemaLoading ? "Loading schema…" : "Load the schema to start building."}
              </div>
            </div>
          )}

          {schema && selectedBlock ? (
            <BlockInspector
              block={selectedBlock}
              schema={schema}
              data={data}
              onChangeBlock={handleChangeBlock}
              onChangeData={setData}
              onRemoveBlock={handleRemoveBlock}
              onClose={handleCloseInspector}
            />
          ) : schema ? (
            <DocumentSettingsInspector
              template={serializedTemplate}
              metadata={schema["x-pdfUa"]}
              format={pageSize.format}
              orientation={pageSize.orientation}
              footerRepeat={footerRepeat}
              pageNumbers={pageNumbers}
              onChangeTemplate={handleChangeTemplateSettings}
              onChangeFormat={handleChangeFormat}
              onChangeOrientation={handleChangeOrientation}
              onToggleFooterRepeat={handleToggleFooterRepeat}
              onChangePageNumbers={handleChangePageNumbers}
            />
          ) : null}
        </section>

        <PdfPane
          pdfUrl={pdfUrl}
          error={error}
          loading={pdfLoading}
          template={serializedTemplate}
          data={data}
        />

        <DragOverlay dropAnimation={null}>
          {activeDrag ? <ActiveDragPreview drag={activeDrag} /> : null}
        </DragOverlay>
      </DndContext>
    </main>
  );
}

function ActiveDragPreview({ drag }: { drag: NonNullable<ActiveDrag> }) {
  if (drag.kind === "palette") {
    return <BlockCardPreview type={drag.type} prefix="+ " />;
  }
  if (drag.kind === "block") {
    return (
      <BlockCardPreview
        type={drag.block.type}
        summary={getBlockSummary(drag.block)}
      />
    );
  }
  return (
    <div className="pointer-events-none origin-top-left rotate-[1.5deg] scale-[1.02] cursor-grabbing drop-shadow-drag">
      <div className="inline-flex min-w-[180px] max-w-[360px] items-center gap-2 rounded-lg border border-solid border-border-strong bg-surface px-3 py-2 text-sm font-medium">
        <Chip>⋮⋮</Chip>
        <span className="font-medium">Row</span>
      </div>
    </div>
  );
}

function revokeObjectUrl(url: string | null): void {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

function getDragData(value: unknown): DragData {
  return isObject(value) ? (value as DragData) : {};
}

function getDropTarget(
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

function findEditorBlock(model: EditorModel, blockUid: string): EditorBlock | undefined {
  return [...model.rows, ...model.footerRows]
    .flatMap((row) => row.blocks)
    .find((block) => block.uid === blockUid);
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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
