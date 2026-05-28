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
import { BlockCardPreview } from "./canvas/BlockCardPreview";
import { BuilderCanvas } from "./canvas/BuilderCanvas";
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

export function TemplateBuilderPage() {
  const defaultApiUrl = resolveDefaultApiUrl(import.meta.env.VITE_PDF_UA_API_URL);
  const [apiUrl, setApiUrl] = useState(defaultApiUrl);
  const [schema, setSchema] = useState<TemplateSchemaResponse | null>(null);
  const [model, setModel] = useState<EditorModel>(() => createEditorModel(emptyTemplate));
  const [data, setData] = useState<TemplateData>({});
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag>(null);
  const initialApiUrl = useRef(defaultApiUrl);
  const mounted = useRef(false);
  const schemaRequestId = useRef(0);
  const renderRequestId = useRef(0);
  const pdfUrlRef = useRef<string | null>(null);
  const schemaObject = schema as unknown as JsonSchemaObject | null;
  const blockTypes = useMemo(
    () => (schemaObject ? getBlockTypes(schemaObject) : []),
    [schemaObject],
  );
  const pageSize = getPageSize(model);
  const footerRepeat = getFooterRepeat(model);
  const pageNumbers = getPageNumbers(model);
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

  const handleRemoveBlock = useCallback((blockUid: string) => {
    setModel((currentModel) => removeBlock(currentModel, blockUid));
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

  return (
    <main className="template-builder-page">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <section
          className="template-builder-page__authoring"
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

          <aside className="builder-palette" aria-label="Block palette">
            <div>
              <h2 className="builder-palette__section-title">Blocks</h2>
              <BlockPalette blockTypes={blockTypes} onAdd={handleAddBlock} />
            </div>
          </aside>

          {schema ? (
            <BuilderCanvas
              schema={schema}
              model={model}
              format={pageSize.format}
              orientation={pageSize.orientation}
              footerRepeat={footerRepeat}
              pageNumbers={pageNumbers}
              onChangeBlock={handleChangeBlock}
              onRemoveBlock={handleRemoveBlock}
              onSetRowWidths={handleSetRowWidths}
              onToggleFooterRepeat={handleToggleFooterRepeat}
              onChangePageNumbers={handleChangePageNumbers}
            />
          ) : (
            <div className="builder-canvas">
              <div className="builder-canvas__empty">
                {schemaLoading ? "Loading schema…" : "Load the schema to start building."}
              </div>
            </div>
          )}
        </section>

        <PdfPane
          pdfUrl={pdfUrl}
          error={error}
          loading={pdfLoading}
          onRender={() => void renderPdf()}
          renderDisabled={!schema || pdfLoading}
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
    <div className="builder-drag-overlay">
      <div className="builder-drag-overlay__card">
        <span className="builder-chip" aria-hidden="true">
          ⋮⋮
        </span>
        <span style={{ fontWeight: 500 }}>Row</span>
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
