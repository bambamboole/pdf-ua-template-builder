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
import type { Block, Template } from "../types/generated/template";
import type { TemplateSchemaResponse } from "../types/template";
import { BlockPalette } from "./blocks/BlockPalette";
import { BuilderCanvas } from "./canvas/BuilderCanvas";
import { PdfPane } from "./pdf/PdfPane";
import {
  createDefaultBlock,
  createExampleTemplate,
  getBlockTypes,
  type JsonSchemaObject,
} from "./schema/schemaAdapter";
import {
  addBlockToNewRow,
  addBlockToRow,
  createEditorModel,
  moveBlock,
  moveRow,
  removeBlock,
  serializeTemplate,
  setRowWidths,
  updateBlock,
  type EditorModel,
} from "./state/editorModel";

const emptyTemplate: Template = {
  version: 1,
};

interface DragData {
  source?: string;
  type?: string;
  rowUid?: string;
  blockUid?: string;
}

interface DropTarget {
  rowUid: string | null;
  index: number;
}

export function TemplateBuilderPage() {
  const defaultApiUrl = resolveDefaultApiUrl(import.meta.env.VITE_PDF_UA_API_URL);
  const [apiUrl, setApiUrl] = useState(defaultApiUrl);
  const [schema, setSchema] = useState<TemplateSchemaResponse | null>(null);
  const [model, setModel] = useState<EditorModel>(() => createEditorModel(emptyTemplate));
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
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
  const sensors = useSensors(
    useSensor(PointerSensor),
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
    if (!schemaObject) {
      return;
    }

    setModel(createEditorModel(createExampleTemplate(schemaObject)));
  }, [schemaObject]);

  const renderPdf = useCallback(async () => {
    const requestId = renderRequestId.current + 1;
    renderRequestId.current = requestId;
    setPdfLoading(true);
    setError(null);

    try {
      const pdf = await renderTemplatePdf(apiUrl, {
        template: serializeTemplate(model),
        data: {},
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
  }, [apiUrl, model]);

  const handleChangeBlock = useCallback((blockUid: string, block: Block) => {
    setModel((currentModel) => updateBlock(currentModel, blockUid, block));
  }, []);

  const handleRemoveBlock = useCallback((blockUid: string) => {
    setModel((currentModel) => removeBlock(currentModel, blockUid));
  }, []);

  const handleSetRowWidths = useCallback((rowUid: string, widths: string[]) => {
    setModel((currentModel) => setRowWidths(currentModel, rowUid, widths));
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = getDragData(event.active.data.current);

    setActiveLabel(data.source === "palette" && data.type ? formatBlockLabel(data.type) : null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveLabel(null);

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
            ? addBlockToNewRow(currentModel, block)
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

          return moveBlock(currentModel, activeData.blockUid ?? "", target.rowUid, target.index);
        });
      }
    },
    [schemaObject],
  );

  return (
    <main className="template-builder-page">
      <section className="template-builder-page__authoring" aria-label="Template authoring">
        <div className="template-builder-page__toolbar">
          <label>
            API URL
            <input value={apiUrl} onChange={(event) => setApiUrl(event.currentTarget.value)} />
          </label>
          <button type="button" onClick={() => void loadSchema(apiUrl)} disabled={schemaLoading}>
            Load schema
          </button>
          <button type="button" onClick={loadExample} disabled={!schema}>
            Load example
          </button>
          <button type="button" onClick={renderPdf} disabled={!schema || pdfLoading}>
            Render PDF
          </button>
          <output>
            {schemaLoading ? "Loading schema" : schema ? "Schema loaded" : "Schema empty"}
          </output>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <BlockPalette blockTypes={blockTypes} />
          {schema ? (
            <BuilderCanvas
              schema={schema}
              model={model}
              onChangeBlock={handleChangeBlock}
              onRemoveBlock={handleRemoveBlock}
              onSetRowWidths={handleSetRowWidths}
            />
          ) : (
            <div>Load schema to start building.</div>
          )}
          <DragOverlay>{activeLabel ? <div>{activeLabel}</div> : null}</DragOverlay>
        </DndContext>
      </section>

      <PdfPane pdfUrl={pdfUrl} error={error} loading={pdfLoading} />
    </main>
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
    return {
      rowUid: null,
      index: 0,
    };
  }

  if (overData.type === "block" && overData.rowUid && overData.blockUid) {
    return {
      rowUid: overData.rowUid,
      index: getBlockIndex(model, overData.blockUid),
    };
  }

  if (overData.type === "row" && overData.rowUid) {
    return {
      rowUid: overData.rowUid,
      index: getRowBlockCount(model, overData.rowUid),
    };
  }

  return {
    rowUid: null,
    index: 0,
  };
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
  const index = model.rows.findIndex((row) => row.uid === rowUid);

  return index === -1 ? null : index;
}

function getBlockIndex(model: EditorModel, blockUid: string): number {
  for (const row of model.rows) {
    const index = row.blocks.findIndex((block) => block.uid === blockUid);

    if (index !== -1) {
      return index;
    }
  }

  return 0;
}

function getRowBlockCount(model: EditorModel, rowUid: string): number {
  return model.rows.find((row) => row.uid === rowUid)?.blocks.length ?? 0;
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

function formatBlockLabel(type: string): string {
  return `+ ${type
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ")}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
